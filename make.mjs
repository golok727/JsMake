import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";
const defaultConfig = {
	src: "./src",

	dist: "./dist",

	executable: "main",

	includeFileTypes: ["cpp", "hpp"],

	runAfterBuild: false,
};

const loadConfigJson = async (configFileName = "makeconfig.json") => {
	const configFilePath = path.join(process.cwd(), configFileName);
	try {
		await fs.access(configFilePath);
	} catch (_) {
		throw new Error(
			`Config file "makeconfig.json" is not found in ${process.cwd()} please include it`
		);
	}

	const data = await fs.readFile(configFilePath, { encoding: "utf-8" });
	return JSON.parse(data);
};

/**
 *
 * @param {ConfigFile} config
 *
 * Builds the project
 *
 */
const buildProject = async (config) => {
	console.log("-".repeat(50));
	console.log("Building Project: ", process.cwd());
	console.log("Using Configuration: ", path.resolve(config.configFile));
	console.log("Using g++");
	console.log("-".repeat(50), "\n");

	const dirItems = await fs.readdir(path.resolve(config.src), {
		recursive: true,
		encoding: "utf-8",
		withFileTypes: true,
	});

	const cppFiles = dirItems
		.filter((item) => item.isFile() && item.name.endsWith(".cpp"))
		.map((item) => path.resolve(config.src, item.name));

	if (cppFiles.length === 0) {
		console.error(
			`\nError: No files found in the directory mentioned in config file <src>: ${path.resolve(
				config.src
			)}\n\n`,
			`Make sure to check the include files type to add it for compiling\n`,
			"\nConfig File\n",
			`${"-".repeat(50)}\n`,
			config
		);
		process.exit(1);
	}

	cppFiles.forEach((file) => {
		console.log(`Staging => ${file}`);
	});

	const distDir = path.resolve(config.dist);

	if (!existsSync(distDir)) {
		await fs.mkdir(distDir);
	}

	const dist = path.resolve(config.dist, config.executable);
	const build = spawn("g++", [...cppFiles, "-o", dist]);

	build.stdout.on("data", (data) => {
		console.log("Build Output: \n", data);
	});

	build.stderr.on("data", (error) => {
		console.log("\nBuild Error: ");
		console.log("-".repeat(50));
		console.log(error.toString());
		console.log("-".repeat(50));
	});

	build.on("close", async (code) => {
		if (code == 0) {
			console.log("\nCompilation successful..");
			// for windows the file extension will be .exe

			const distItems = await fs.readdir(path.resolve(config.dist));

			const exeFile =
				distItems.filter((file) =>
					file.match(new RegExp(config.executable))
				)[0] ?? config.executable;

			const exePath = path.resolve(config.dist, exeFile);
			console.log(`Executable: ${exePath}`);

			if (config.runAfterBuild) {
				console.clear();
				console.log(`Running Executable ${exePath}`);

				console.log("\nOutput:");
				console.log("-".repeat(50));

				const runProcess = spawn(exePath, [], { stdio: ["inherit"] }); // setup to also work with std::in

				runProcess.stdout.on("data", (data) => {
					console.log(data.toString());
				});

				runProcess.stderr.on("data", (data) => {
					console.log(data.toString());
				});

				runProcess.on("close", (code) => {
					console.log("-".repeat(50));
					console.log(`Program exited with code ${code}`);
				});
			}
		} else {
			console.log(`Build failed with exit code: ${code}`);
		}
	});
};

/**
 *
 * @param {string []} args
 * @returns { ConfigFile }
 */
const parseArguments = (args) => {
	const parsed = {
		configFile: "makeconfig.json",
	};
	for (let i = 0; i < args.length; i++) {
		// Change Config file name
		if (args[i] == "-c") {
			if (![args[i + 1]]) {
				console.error(
					"Error: The config file name must not be empty if -c flag is specified..",
					"\nmake/mjs -c <config_file_name>.json"
				);
				process.exit(1);
			}
			parsed.configFile = args[i + 1];
		}
	}
	return parsed;
};

(async () => {
	let args = process.argv.splice(2);

	args = parseArguments(args);

	try {
		let makeConfig = {
			...defaultConfig,
			...(await loadConfigJson(args.configFile)),
			...args,
		};

		buildProject(makeConfig);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
})();
