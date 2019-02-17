const fse = require('fs-extra');
const inquirer = require('inquirer');
const fetch = require('fetch');
const cp = require('child_process');
const path = require('path');
const youtubedl = require('youtube-dl');

(function prompt(){
  inquirer.prompt([{type: "list", name: "choices", message: "What would you like to do?", choices:["download photos", "download video", "view photos", "play videos", "exit"]}]).then(function(answer){
    if (answer.choices == "download photos"){
      inquirer.prompt([{type: String, name: "subreddit", message: "What subreddit would you like to download pictures from?"}]).then(function(answer){
        fetch.fetchUrl("http://reddit.com/r/"+answer.subreddit+".json", function(err, meta, body){
          if (err){
            console.error("No such subreddit.");
            prompt();
          } else {
            let responseObjects = JSON.parse(body).data.children;
            function findUrls(children){
                let urls = [];
                for (let i=0; i<children.length; i++){
                    if (children[i].data.url){
                        urls.push(children[i].data.url);
                    }
                }
                return urls;
            }
            let urls = findUrls(responseObjects);

            for (let i=0; i < urls.length; i++){
              if (urls[i].match(/\.jpg/)){
                let out = fse.createWriteStream(path.join(__dirname, "images/") + answer.subreddit + i.toString() + '.jpg');
                new fetch.FetchStream(urls[i]).pipe(out);
              }
            }
            prompt();
          }
        });
      });
    }
    if (answer.choices == "view photos"){
      try {
        process.chdir("MediaHelper/images");
        cp.exec("feh -z -F -D 5");
        prompt();
      } catch (err){
        console.error(err);
      }
    }
    if (answer.choices == "download video"){
      inquirer.prompt([{type: String, name: "url", message: "Enter video URL."}]).then(function(answer){
        try {
//          cp.exec("youtube-dl -F -o " + path.join(__dirname, "videos/") + "%(NAME)s" + answer.url);
// NOT WORKING!!!!!!!!!
          let video = youtubedl(answer.url, ['--format=mp4-high']);
          video.on('info', function(info){
            let filename = info._filename;
            console.log('Video downloading as ' + filename);
            video.pipe(fse.createWriteStream(path.join(__dirname, "videos/") + filename));
            prompt();
          });
          video.on('end', function() {
            console.log('finished downloading!');
            prompt();
          });
        } catch (err){
          console.error(err);
          prompt();
        }
      });
    }
    if (answer.choices == "play videos"){
      try {
        process.chdir("MediaHelper/videos");
        fse.readdir(process.cwd(), function(err, items){
          if (err){
            console.error(err);
          } else {
            let itemString = '';
            items.forEach(function(item){
              itemString += '"' + item + '" ';
            });
            cp.exec("vlc " + itemString);
            prompt();
        }
      });
    } catch (err){
          console.error(err);
      }
    }
    if (answer.choices == "exit"){
      return "Thanks for using MediaHelper."
    }
  });

})();
