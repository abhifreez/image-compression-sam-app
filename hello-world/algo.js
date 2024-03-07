const moment = require("moment");
const simpleGit = require("simple-git");
const jsonFile = require("jsonfile");
const FILE_PATH = "data.json";

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const makeCommit = (number) => {
  if (number === 0) {
    simpleGit().push();
  } else {
    const DATE = moment()
      .subtract(randomIntFromInterval(700, 1000), "d")
      .format();

    const data = {
      data: DATE,
    };

    jsonFile.writeFile(FILE_PATH, data, () => {
      simpleGit()
        .add(FILE_PATH)
        .commit(DATE, { "--date": DATE }, () => {
          console.log(DATE);
          makeCommit(--number);
        });
    });
  }
};

//makeCommit(50);
