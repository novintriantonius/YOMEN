import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';
import Logger from '#utils/Logger';
import { mkdirp } from 'mkdirp';

export class DriverManager {
    private driverOutputDir: string;

    constructor(outputDir: string = 'driver') {
        this.driverOutputDir = path.resolve(outputDir);
    }

    /**
     * Get Chrome driver directory based on the current OS
     */
    private getChromeDriverDir(): string {
        return path.join(this.driverOutputDir, 'chrome');
    }

    /**
     * Ensure the driver directory exists
     */
    private async ensureDriverDir(): Promise<void> {
        if (!fs.existsSync(this.driverOutputDir)) {
            await mkdirp(this.driverOutputDir);
        }
        
        const chromeDir = this.getChromeDriverDir();
        if (!fs.existsSync(chromeDir)) {
            await mkdirp(chromeDir);
        }
    }

    /**
     * Download the appropriate Chrome driver for the current OS
     */
    public async downloadChromeDriver(): Promise<string> {
        await this.ensureDriverDir();
        
        const chromeDir = this.getChromeDriverDir();
        
        return new Promise<string>((resolve, reject) => {
            Logger.info('Downloading Chrome driver for your operating system...');
            
            const webdriverBin = path.join(process.cwd(), 'node_modules', '.bin', 
                os.platform() === 'win32' ? 'webdriver-manager.cmd' : 'webdriver-manager');
            
            if (!fs.existsSync(webdriverBin)) {
                Logger.error(`webdriver-manager binary not found at: ${webdriverBin}`);
                Logger.info('Running npm install to ensure webdriver-manager is installed...');
                
                // Run npm install to ensure webdriver-manager is installed
                const npmInstall = spawn('npm', ['install', 'webdriver-manager', '--save'], { 
                    stdio: 'inherit',
                    shell: true
                });
                
                npmInstall.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Failed to install webdriver-manager. Exit code: ${code}`));
                        return;
                    }
                    
                    // Try again after installation
                    this.downloadChromeDriver().then(resolve).catch(reject);
                });
                
                return;
            }
            
            // Update and download the Chrome driver
            const args = ['update', '--chrome', `--out_dir=${chromeDir}`];
            Logger.info(`Running command: ${webdriverBin} ${args.join(' ')}`);
            
            const webdriverProcess = spawn(webdriverBin, args, { 
                stdio: 'inherit',
                shell: true
            });
            
            webdriverProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Failed to download Chrome driver. Exit code: ${code}`));
                    return;
                }
                
                // Find the Chrome driver executable
                const chromeExecutable = this.findChromeDriverExecutable(chromeDir);
                if (!chromeExecutable) {
                    reject(new Error('Chrome driver executable not found after download'));
                    return;
                }
                
                Logger.info(`Chrome driver downloaded successfully to: ${chromeExecutable}`);
                resolve(chromeExecutable);
            });
        });
    }
    
    /**
     * Find the Chrome driver executable in the specified directory
     */
    private findChromeDriverExecutable(dir: string): string | null {
        if (!fs.existsSync(dir)) {
            return null;
        }
        
        // Recursively scan for the executable
        const findExecutable = (searchDir: string): string | null => {
            const platform = os.platform();
            const exactExecutableName = platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
            
            const items = fs.readdirSync(searchDir);
            
            // First look for exact match
            for (const item of items) {
                const itemPath = path.join(searchDir, item);
                
                if (fs.statSync(itemPath).isFile() && item === exactExecutableName) {
                    // Make sure it's executable on Unix systems
                    if (platform !== 'win32') {
                        fs.chmodSync(itemPath, 0o755);
                    }
                    return itemPath;
                }
            }
            
            // Then look for chromedriver with version numbers
            for (const item of items) {
                const itemPath = path.join(searchDir, item);
                
                if (fs.statSync(itemPath).isFile() && 
                    (item.startsWith('chromedriver_') || item.startsWith('chromedriver-'))) {
                    
                    // Create symlink to standard name if on Unix systems
                    if (platform !== 'win32') {
                        const linkPath = path.join(searchDir, 'chromedriver');
                        // Create a symbolic link or copy the file
                        try {
                            if (fs.existsSync(linkPath)) {
                                fs.unlinkSync(linkPath);
                            }
                            fs.symlinkSync(itemPath, linkPath);
                            fs.chmodSync(linkPath, 0o755);
                            Logger.info(`Created symlink to ${item} at ${linkPath}`);
                            return linkPath;
                        } catch (error) {
                            // If symlink fails, try copying the file
                            fs.copyFileSync(itemPath, linkPath);
                            fs.chmodSync(linkPath, 0o755);
                            Logger.info(`Copied ${item} to ${linkPath}`);
                            return linkPath;
                        }
                    } else {
                        // On Windows, just return the path with version
                        return itemPath;
                    }
                }
            }
            
            // Then look in subdirectories
            for (const item of items) {
                const itemPath = path.join(searchDir, item);
                
                if (fs.statSync(itemPath).isDirectory()) {
                    const found = findExecutable(itemPath);
                    if (found) {
                        return found;
                    }
                }
            }
            
            return null;
        };
        
        const executable = findExecutable(dir);
        
        if (executable) {
            // Log all files in the directory for debugging
            Logger.info(`Files in ${dir}:`);
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                Logger.info(`- ${item}`);
            });
            
            return executable;
        }
        
        return null;
    }
    
    /**
     * Get the path to the Chrome driver executable
     * Downloads it if it doesn't exist
     */
    public async getChromeDriverPath(): Promise<string> {
        const chromeDir = this.getChromeDriverDir();
        
        if (!fs.existsSync(chromeDir) || fs.readdirSync(chromeDir).length === 0) {
            return this.downloadChromeDriver();
        }
        
        const executable = this.findChromeDriverExecutable(chromeDir);
        if (executable) {
            Logger.info(`Using existing Chrome driver at: ${executable}`);
            return executable;
        }
        
        // If no executable found, download it
        return this.downloadChromeDriver();
    }
} 