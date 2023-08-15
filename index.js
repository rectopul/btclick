const fsPromises = require('fs/promises')
const fs = require('fs');
const readline = require('readline')
const proxy = require('selenium-webdriver/proxy')
const chrome = require('selenium-webdriver/chrome');
const proxyChain = require('proxy-chain')
const webdriver = require('selenium-webdriver')
const { Builder, By, Key, until } = require('selenium-webdriver');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const SBR_WEBDRIVER = 'https://brd-customer-hl_f4002949-zone-serp-country-br:s3ghgf3j4i77@brd.superproxy.io:9515';

/* PRECONDITION:
  0. download ublock, I used https://github.com/gorhill/uBlock/releases/download/1.14.19b5/uBlock0.chromium.zip
  1. run $PATH_TO_CHROME --user-data-dir=/some/empty/directory --load-extension=/location/of/ublock
  2. enable block lists you want to use
  */

const ext = './dist/uBlock0.chromium';
const datadir = './profile/';

// Função para fazer uma pergunta ao usuário
function fazerPergunta(pergunta) {
    return new Promise((resolve) => {
      rl.question(pergunta, (resposta) => {
        resolve(resposta);
      });
    });

}

async function createBrowserWithProxy(theProxy) {

    try {
      
      const anonymizedProxy = await proxyChain.anonymizeProxy(`http://${theProxy}`);
      console.log(`proxy usado: `, theProxy)
      const options = new chrome.Options();
      options.addArguments(`--proxy-server=socks5://${theProxy}`);
      options.addArguments('--ignore-certificate-errors')

      var driver = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
      return driver;
    } catch (error) {
      console.log(`Erro ao criar browser`)
    }
    console.log(`Criando Browser...`)
}

async function tryWithProxy(browser, proxy, url, theLink) {
    await browser.get(url);
    
    const screenshot1 = await browser.takeScreenshot();

    fs.writeFileSync('listAnounces.png', screenshot1, 'base64');

    // try {
    //   await driver.sleep(2000);
    //   const acceptCookiesButton = await browser.wait(
    //     until.elementLocated(By.id('bnp_btn_accept')),
    //     5000 // Tempo limite de espera em milissegundos (10 segundos neste caso)
    //   );

    //   await acceptCookiesButton.click();
    // } catch (error) {
    //   console.log(`Botão de aceitar cookies não existe`)
    // }


    try {
      //await browser.sleep(5000);
      const contentToFind = theLink;
      
      try {
        const links = await browser.findElements(By.tagName('a'));
        // Procurar e clicar no link que contém o texto alvo
        for (const link of links) {
          const text = await link.getText();
          if (text && text.includes(contentToFind)) {
            console.log(`link encontrado...`)
            await link.click();
            break; // Sair do loop depois de encontrar o primeiro link
          }
        }
      } catch (error) {
        console.log(`link não encontrado...`)
      }
      

      await browser.sleep(2000);

      const screenshot = await browser.takeScreenshot();

      fs.writeFileSync('screenshot.png', screenshot, 'base64');

      const currentUrl = await browser.getCurrentUrl();

      console.log(`url atual: `, currentUrl)

      setTimeout(async () => {
        await browser.quit()
      }, 3000);

      console.log(`Continuando para o proximo`)
    } catch (error) {
      console.error(`Proxy ${proxy} falhou: ${error}`);
      
      
    }

    return true;
  }

(async () => {
    const proxies = await fsPromises.readFile('proxy-list.txt', 'utf-8');
    const proxyList = proxies.split('\r').filter(proxy => proxy.trim() !== '');
    const cleanList = proxyList.map(p => {
        return p.replace('\n', '')
        
    })

    console.log(cleanList)
    const bots = await fazerPergunta('Bots?: ');
    const url = await fazerPergunta('Digite a URL: ');
    const link = await fazerPergunta('link para derrubar: ');

    for (let index = 0; index < bots; index++) {
      for (let index = 0; index < cleanList.length; index++) {
          const proxy = cleanList[index]
          let success = false;
          let browser = null;
  
          try {
              browser = await createBrowserWithProxy(proxy);

              if(browser) {
                success = await tryWithProxy(browser, `proxy`, url, link);
              }else{
                console.log(`browser não criado`)
              }
          } catch (error) {
              console.error(`Erro ao criar o navegador com proxy ${proxy}: ${error}`);
          }
  
          if (success) {
              console.log('Continuando com o próximo proxy...');
          } else {
              console.log('Tentando próximo proxy...');
          }
        
      }
    }

    // for (const proxy of cleanList) {
    //     let success = false;
    //     let browser = null;

    //     try {
    //         browser = await createBrowserWithProxy(proxy);
    //         success = await tryWithProxy(browser, proxy, url, seletor, link);
    //     } catch (error) {
    //         console.error(`Erro ao criar o navegador com proxy ${proxy}: ${error}`);
            
    //     } finally {
    //         if (browser) {
    //           //await browser.quit();
    //         }
    //     }

    //     if (success) {
    //         console.log('Continuando com o próximo proxy...');
    //         //break; // Se um proxy funcionou, pare a iteração
    //     } else {
    //         console.log('Tentando próximo proxy...');
    //     }
        
    // }
  
    rl.close();
  
  })();