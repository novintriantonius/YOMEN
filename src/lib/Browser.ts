import fs from "fs";
import path from "path";
import os from "os";
import UndetectableBrowser from "undetected-browser";
import puppeteer, { Browser, Page } from "puppeteer";
import { setEnv } from "#config/index";
import { mkdirp } from 'mkdirp';
import { DriverManager } from "../utils/driverManager";

export class LaunchBrowser {
    public browser: Browser | null;
    public page: Page | null;
    public username: string;
    private driverManager: DriverManager;

    constructor(username: string) {
        this.username = username;
        this.browser = null;
        this.page = null;
        this.driverManager = new DriverManager();
    }

    /**
     * Initialize the browser with undetectable settings and a specific user session.
     */
    async init(): Promise<void> {
        const sessionDir = path.resolve(`session/${this.username}`);
        await mkdirp(sessionDir);
  
        // Get Chrome driver path using the driver manager
        const chromeDriverPath = await this.driverManager.getChromeDriverPath();
        
        if (!chromeDriverPath) {
            throw new Error("Failed to get Chrome driver. Please ensure webdriver-manager is installed.");
        }

        // Use the correct path separator based on platform
        const pathSeparator = os.platform() === 'win32' ? ';' : ':';
        
        const UndetectableBMS = new UndetectableBrowser(
            await puppeteer.launch({ 
                headless: false,
                executablePath: os.platform() === 'win32' ? 
                    path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium', 'win64-116.0.5845.96', 'chrome-win', 'chrome.exe') : 
                    undefined, // Use default Chrome on non-Windows platforms
                userDataDir: `session/${this.username}`,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=SiteIsolation',
                    '--disable-site-isolation-trials',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--no-zygote',
                    '--mute-audio',
                    '--no-zygote-forced',
                    '--no-zygote-forced-for-chrome',
                    '--disable-web-security',
                ],
                env: {
                    ...process.env,
                    CHROME_DRIVER_PATH: chromeDriverPath,
                    PATH: `${path.dirname(chromeDriverPath)}${pathSeparator}${process.env.PATH || ''}`
                }
            })
        );

        this.browser = await UndetectableBMS.getBrowser();
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1375, height: 3812 });
        await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")
        setEnv(`SESSION_DIR_${this.username}`, `session/${this.username}`);
    }

    /**
     * Close the browser instance.
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
