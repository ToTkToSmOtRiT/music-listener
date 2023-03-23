let fs = require("fs");

async function loadAll() {
  try {
    const data = JSON.parse(
      await fs.readFileSync("src/api/comments.txt", "utf-8")
    );
    return data.songs;
  } catch (err) {
    console.log(err);
  }
}

// async function addComment( ) {
//   // try {
//   //   const data = JSON.parse(
//   //     await fs.readFileSync("./api/comments.txt", "utf-8")
//   //   );
//   //   data.songs[song[songName]].comments.push(res);
//   //   fs.writeFileSync("./api/comments.txt", JSON.stringify(data), "utf-8");
//   //   return data.products;
//   // } catch (err) {
//   //   console.log(err);
//   // }
// }

module.exports = {
  loadAll,
  
}

// export { loadAll }


