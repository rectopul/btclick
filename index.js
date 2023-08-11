import puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';
import readline from 'readline'
import useProxy from 'puppeteer-page-proxy'
import proxyChain from 'proxy-chain'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Função para fazer uma pergunta ao usuário
function fazerPergunta(pergunta) {
    return new Promise((resolve) => {
      rl.question(pergunta, (resposta) => {
        resolve(resposta);
      });
    });

}

async function createBrowserWithProxy(proxy) {
    const anonymizedProxy = await proxyChain.anonymizeProxy(`http://${proxy}`);
    const browser = await puppeteer.launch({
      args: [`--proxy-server=${anonymizedProxy}`, "--no-sandbox"],
      headless: false,
    });
  
    return browser;
}

async function tryWithProxy(browser, proxy, url, selector) {
    const page = await browser.newPage();
    // await page.authenticate();
    // await page.authenticate({
    //     username: 'B5zj9X1eM-dc-any', // se necessário
    //     password: '92xpk0YVH', // se necessário
    // });
  
    try {
        //await page.setRequestInterception(true);
        await page.goto(url, {timeout: 5000});

        // page.on('request', (request) => {
        //     request.continue({
        //       proxy: `https=https://${proxy}`,
        //     });
        // });
        // Faça as operações na página aqui

        try {
            await page.waitForSelector(selector, { timeout: 5000 }); // Timeout de 5 segundos
            console.log(`O seletor "${selector}" existe na página.`);
        } catch (error) {
            console.error(`O seletor "${selector}" não foi encontrado na página.`);
        }

        console.log(`Proxy ${proxy} funcionou!`);
        await page.close();
        return true;
    } catch (error) {
      console.error(`Proxy ${proxy} falhou: ${error}`);
      await page.close();
      return false;
    }
  }

(async () => {
    const proxies = await fsPromises.readFile('proxy-list.txt', 'utf-8');
    const proxyList = proxies.split('\n').filter(proxy => proxy.trim() !== '');
    const cleanList = proxyList.map(p => {
        return p.replace('\r', '')
        
    })

    console.log(cleanList)
    //console.log(`path: `, path.join(__dirname))
    const url = await fazerPergunta('Digite a URL: ');
    const seletor = await fazerPergunta('Digite o seletor CSS: ');

    for (const proxy of cleanList) {
        let success = false;
        let browser = null;

        try {
            browser = await createBrowserWithProxy(proxy);
            // const browser = await puppeteer.launch({
            //     ignoreDefaultArgs: ['--disable-extensions'],
            //     headless: false,
            //     args: [`--proxy-server=${proxy}`]
            // });
            success = await tryWithProxy(browser, proxy, url, seletor);
            // const page = await browser.newPage();
    
            // await page.goto(url);
          
            // Aguarde um elemento específico aparecer na página (você pode usar um seletor CSS, classe, etc.)
            // const elementSelector = '#b_results li.b_vtl_deeplinks h2 a';
        
            // try {
            //     await page.waitForSelector(seletor, { timeout: 5000 }); // Timeout de 5 segundos
            //     console.log(`O seletor "${seletor}" existe na página.`);
            // } catch (error) {
            //     console.error(`O seletor "${seletor}" não foi encontrado na página.`);
            // }
        
            //#b_results > li.b_ad.b_adTop > ul > li:nth-child(1) > div > h2
            //https://www.bing.com/search?q=bradesco+prime
            
          
            // Realize o clique
            // await page.click(seletor);
          
            // Aguarde um tempo antes de fechar o navegador (opcional)
            // await page.waitForTimeout(6000);
          
            // await browser.close();
        } catch (error) {
            console.error(`Erro ao criar o navegador com proxy ${proxy}: ${error}`);
            
        } finally {
            if (browser) {
              await browser.close();
            }
        }

        if (success) {
            console.log('Continuando com o próximo proxy...');
            //break; // Se um proxy funcionou, pare a iteração
        } else {
            console.log('Tentando próximo proxy...');
        }
        
    }
  
    rl.close();
  
  })();