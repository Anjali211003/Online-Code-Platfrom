const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = (filepath) => {
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);

  return new Promise((resolve, reject) => {
    // 1. Compile
    const compileProcess = spawn("g++", [filepath, "-o", outPath]);

    compileProcess.on("exit", (code, signal) => {
      if (code !== 0) {
        const err = new Error(`Compilation failed with code ${code}`);
        reject({ error: err, stderr: compileProcess.stderr.read().toString() }); // Capture stderr
        return;
      }

      // 2. Execute (only if compilation succeeded)
      const executeProcess = spawn(outPath); // Run directly from the output path.

      let stdout = "";
      let stderr = "";

      executeProcess.stdout.on("data", (data) => {
        stdout += data;
      });

      executeProcess.stderr.on("data", (data) => {
        stderr += data;
      });

      executeProcess.on("exit", (code, signal) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          const err = new Error(`Execution failed with code ${code}`);
          reject({ error: err, stderr: stderr, exitCode: code });
        }
        // Optionally clean up
        fs.unlinkSync(outPath); // Remove .out file after execution
      });
    });

        compileProcess.stderr.on('data', data => {
            console.error(`Compilation stderr: ${data}`);
        });
  });
};

module.exports = {
  executeCpp,
};
