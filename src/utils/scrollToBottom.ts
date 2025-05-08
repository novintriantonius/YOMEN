export default async function scrollToBottom(pages, attempts = 0, maxAttempts = 300, interval = 200) {

    await pages.evaluate(async (attemptsParam, maxAttemptsParam, intervalParam) => {
        await new Promise<void>((resolve) => {
            let lastScrollHeight = document.body.scrollHeight;
            let attempts = attemptsParam;
            const maxAttempts = maxAttemptsParam;
            const interval = intervalParam; 

            const timer = setInterval(() => {
                window.scrollBy(0, window.innerHeight); 
                if (document.body.scrollHeight > lastScrollHeight) {
                    lastScrollHeight = document.body.scrollHeight; 
                    attempts = 0; 
                } else {
                    attempts++;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(timer);
                    resolve();
                }
            }, interval);
        });
    }, attempts, maxAttempts, interval);
}