const form = document.querySelector("form");
const fileInput = form.querySelector(".file-input");
const btn = document.querySelector(".btn");
const viewFiles = document.querySelector(".view-file");
const genReport = document.querySelector(".genReport");
const showReport = document.querySelector(".reports");
const reportSec = document.querySelector(".reports-sec");

let files = [];

form.addEventListener("click", () => {
  fileInput.click();
});

fileInput.onchange = ({ target }) => {
  files = target.files;
  viewFiles.innerHTML = "";

  if (files.length > 0) {
    btn.style.cursor = "pointer";

    for (let i = 0; i < files.length; i++) {
      const fileNameDiv = document.createElement("div");
      fileNameDiv.classList.add("file-chip");
      fileNameDiv.textContent = files[i].name;
      viewFiles.appendChild(fileNameDiv);
    }
  }
};

const getLanguageVersion = async (fileExtn) => {
  const response = await fetch("https://emkc.org/api/v2/piston/runtimes");
  const data = await response.json();

  let language, version;

  data.forEach((langObj) => {
    langObj.aliases.forEach((alias) => {
      if (alias === fileExtn) {
        language = langObj.language;
        version = langObj.version;
      }
    });
  });

  return { language, version };
};

async function getOutput(langVers, name, content) {
  const postData = {
    language: langVers.language,
    version: langVers.version,
    files: [
      {
        name: name,
        content: content,
      },
    ],
    stdin: "",
    args: ["1", "2", "3"],
    compile_timeout: 10000,
    run_timeout: 3000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const result = await response.json();
  return result;
}

genReport.addEventListener("click", async () => {
  const reports = [];

  for (let i = 0; i < files.length; i++) {
    let fileName = files[i].name;
    let fileExtn = files[i].name.split(".")[1];
    let fileContent;

    const reader = new FileReader();

    const fileContentLoaded = new Promise((resolve) => {
      reader.onload = (event) => {
        fileContent = event.target.result;
        resolve();
      };
    });

    reader.readAsText(files[i]);

    await fileContentLoaded;
    const langVers = await getLanguageVersion(fileExtn);

    const output = await getOutput(langVers, fileName, fileContent);
    reports.push(output);
  }

  if (reports.length > 0) {
    showReport.innerHTML = "";

    reports.forEach((report) => {
      const reportDiv = document.createElement("div");
      reportDiv.innerHTML = `
        <div class="report">
          <h5 class="r-language">${report.language}</h5>
          <pre class="r-output">${
            report.run.stdout !== "" ? report.run.stdout : report.run.stderr
          }</pre>
        </div>
      `;
      showReport.appendChild(reportDiv);
    });

    showReport.classList.remove("hide");
    reportSec.classList.remove("hide");
  }
});
