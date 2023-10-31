chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
}, function(tabs) {
  var tab = tabs[0];
  if (tab.url.substring(0,31) == "https://osu.ppy.sh/beatmapsets/" && tab.url.length > 30){
    const beatmapStringArray = tab.url.substring(31).split("#");
    const beatmapSetID = beatmapStringArray[0];
    const osuModesArray = ["osu", "taiko", "fruits", "mania"];
    const osuMode = osuModesArray.indexOf(beatmapStringArray[1].split("/")[0]);
    const difficultyID = beatmapStringArray[1].split("/")[1];
    const apiURLAdditions = "&s=" + beatmapSetID + "&b=" + difficultyID + "&m=" + osuMode; 
    const beatmapCoverImg = "https://assets.ppy.sh/beatmaps/" + beatmapSetID + "/covers/cover.jpg";
    const ppcalcAPIURL = "https://pp.osuck.net/pp?id=" + difficultyID;

    document.getElementById("navigationError").hidden = true;

    function recalcPP() {
      let modID = 0;
  
      if (document.getElementById("FL").checked){
          modID += 1024
      }
  
      if (document.getElementById("DT").checked){
          modID += 64
      }
  
      if (document.getElementById("HR").checked){
          modID += 16
      }
  
      if (document.getElementById("HD").checked){
          modID += 8
      }    

      fetch(ppcalcAPIURL + "&mods=" + modID) 
      .then(response => { 
        if (response.ok) { 
          return response.json(); 
        } else { 
          throw new Error('API request failed'); 
        } 
      }) 
      .then(data => {
        console.log(ppcalcAPIURL + "&mods=" + modID); // Testing
        let accuracy = Math.round(document.getElementById("accSlider").value * 10) / 10;
        let performancePoints = data.pp.acc[Math.round(accuracy)];
        if (Math.round(accuracy) != accuracy) { // If accuracy is not int
          performancePoints = (data.pp.acc[Math.floor(accuracy)] + data.pp.acc[Math.ceil(accuracy)]) / 2; // Approximate non int acc pp values
        } else { // If accuracy is int
          performancePoints = data.pp.acc[accuracy];
        }
        
        document.getElementById("mapStats").innerHTML = "AR: " + data.stats.ar + " OD: " + data.stats.od + " CS: " + data.stats.cs + " HP: " + data.stats.hp + " BPM: " + data.stats.bpm.api; 
        document.getElementById("stars").innerHTML = data.stats.star.pure;
        document.getElementById("performancePoints").innerHTML = performancePoints + "pp <span id='offWhite'>for " + accuracy + "%<span/>";
        document.getElementById("accSliderLabel").innerHTML = "Accuracy: " + accuracy + "%";
        
        if (accuracy > 85 && accuracy <= 91) {
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg";
        } else if (accuracy <= 85) { 
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-B.e19fc91b.svg";
        } else{
          if (!document.getElementById("HD").checked){
            document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg"
          } else {
            document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg"
          }
        }

      }) 
      .catch(error => { 
        console.error(error);
      });
    }
    
    fetch(ppcalcAPIURL) 
      .then(response => { 
        if (response.ok) { 
          return response.json(); 
        } else { 
          throw new Error('API request failed'); 
        } 
      }) 
      .then(data => { 
        if (data.status.id <= 0) {
          document.getElementById("rankedStatus").src = "/images/assets/unrankedIcon.png"
        } else if (data.status.id == 1) {
          document.getElementById("rankedStatus").src = "/images/assets/rankedIcon.png"
        } else if (data.status.id == 2 || data.status.id == 3) {
          document.getElementById("rankedStatus").src = "/images/assets/approvedIcon.png"
        } else {
          document.getElementById("rankedStatus").src = "/images/assets/lovedIcon.png"
        }

        if ((data.data.title).length >= 26) {
          data.data.title = (data.data.title).substring(0,23) + "...";
        }

        document.getElementById("coverImage").src = beatmapCoverImg;
        document.getElementById("beatmapDifficultyName").innerHTML = "[" + data.data.diff + "]";
        document.getElementById("beatmapName").innerHTML = data.data.title;
        document.getElementById("artistName").innerHTML = data.data.artist;

        document.getElementById("DT").addEventListener("click", recalcPP);
        document.getElementById("HD").addEventListener("click", recalcPP);
        document.getElementById("HR").addEventListener("click", recalcPP);
        document.getElementById("FL").addEventListener("click", recalcPP);
        document.getElementById("accSlider").addEventListener("change", recalcPP);
        
        document.getElementById("mapStats").innerHTML = "AR: " + data.stats.ar + " OD: " + data.stats.od + " CS: " + data.stats.cs + " HP: " + data.stats.hp + " BPM: " + data.stats.bpm.api; 
        document.getElementById("stars").innerHTML = data.stats.star.pure;
        document.getElementById("performancePoints").innerHTML = data.pp.current + "pp <span id='offWhite'>for 100%<span/>";
        if (!document.getElementById("HD").checked){
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg"
        } else {
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg"
        }
      }) 
      .catch(error => { 
        console.error(error);
      });

  } else {
    document.getElementById("extensionDetails").hidden = true;
    document.getElementById("coverImageCrop").style.height = "1px";
    document.getElementById("coverImageCrop").style.paddingBottom = "0px";
    console.log("Not on an osu! Beatmap Page");
  }

});
