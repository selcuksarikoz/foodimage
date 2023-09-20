import server from "bunrest";
import puppeteer from "puppeteer";

const app = server();
// node node_modules/puppeteer/install.js
app.post("/image", async (req, res) => {
  if(req.body["foodName"] === undefined) {
    return res.status(500).setHeader("content-type", "application/json").send('Internal Server Error')
  }

  const foodName = req.body["foodName"]
  return await getImage(foodName).then((result) => {
    const filename = foodName.replaceAll(" ", "-");
    return res.status(200).send(new File([result], foodName+".jpeg", {
      type: "image/jpeg",
      lastModified: new Date().getTime()
    }))
  }).catch(() => {
    res.status(500).send("oops")
  })

})

app.listen(process.env.PORT || 3000, () => {
  console.log("listening...")
})

async function getImage(foodName: string): Promise<Blob> {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage()
  page.setViewport({
    width: 1920,
    height: 1920
  })
  const convertedName = encodeURIComponent(foodName)
  // await page.goto(`https://www.daringgourmet.com/?s=${convertedName}` ,{
  //   waitUntil: "domcontentloaded"
  // });
  await page.goto(`https://www.thespruceeats.com/search?q=${convertedName}&searchType=recipe` ,{
    waitUntil: "networkidle2"
  });

  // let context = await page.waitForSelector('main.content').then(async () => {
  //   console.log("element bulundu")

  //   const images = await page.evaluate(() => {
  //     console.log("ara")
  //     // @ts-ignore
  //     const links = [...document.querySelectorAll("a.entry-image-link img")];
  //     console.log("links", links);
  //     return links[0]?.src || null
  //   });

  //   return images
  // })

  let context = await page.waitForSelector('ul.results__list', {timeout: 2000}).then(async () => {
    console.log("element bulundu")

    const images = await page.evaluate(() => {
      // @ts-ignore
      const links = [...document.querySelectorAll(".card__image")];
      return links[0]?.src || null
    });

    return images
  })
  
  if(context !== null) {
    // context = context.replace("300x300", "768x768");
    return await fetch(context)
    .then(async (res) => {
      await browser.close();
      return Promise.resolve(res.blob())
    })
  }

  // Close browser.
  
  return Promise.reject({
    message: "not found"
  })
}