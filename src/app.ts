import { existsSync, unlinkSync } from "node:fs";
import Yargs from "yargs";
import { Daemon } from "./Daemon";
import { PtyClient } from "./PtyClient";

const yargs = Yargs(process.argv.slice(2))
	.group(["daemon", "init", "pool", "shell", "term", "sock"], "Daemon mode")
	.option("daemon", {
		alias: "d",
		type: "boolean",
		desc: "Run in daemon mode which initializes PTY`s",
		default: false,
	})
	.option("init", {
		alias: "i",
		type: "string",
		desc: "Exec cmd in every PTY after its initialization",
	})
	.option("pool", {
		alias: "p",
		type: "number",
		desc: "Number of PTY`s to keep initialized",
		default: 3,
	})
	.option("shell", {
		alias: "s",
		type: "string",
		desc: "Shell to use in PTY`s",
		default: "zsh",
	})
	// is there any need for passing, for example, xterm-kitty?
	.option("term", {
		alias: "t",
		type: "string",
		desc: "Sets XTERM value of PTY`s",
		default: "xterm-256color",
	})
	.option("sock", {
		alias: "S",
		type: "string",
		desc: "UNIX socket path to use",
		default: "/tmp/qshell.sock",
	})

	.group(["attach", "cmd", "sock"], "Client mode")
	.option("attach", {
		alias: "a",
		type: "boolean",
		default: false,
		desc: "Run in client mode: Attach to PTY initialized in daemon",
	})
	.option("cmd", {
		alias: "c",
		type: "string",
		desc: "Exec cmd in PTY after attaching to it",
	})

	.help(false)
	.option("help", {
		alias: "h",
		type: "boolean",
		default: false,
		desc: "Show help (this message)",
	});

const argv = yargs.parseSync();

const main = async () => {
	if (argv.daemon) {
		if (existsSync(argv.sock)) {
			unlinkSync(argv.sock);
		}

		const daemon = new Daemon(argv);

		await daemon.Start();

		process.on("SIGINT", () => daemon.Stop());
		process.on("SIGTERM", () => daemon.Stop());
	} else if (argv.attach) {
		const client = new PtyClient(argv.sock);

		await client.Connect();
		await client.Attach(argv.cmd);

		process.title = `qshell-${client.GetId()}`;
		process.on("SIGINT", () => client.Kill());
		process.on("SIGTERM", () => client.Kill());
	} else {
		yargs.option("attach", { default: undefined });
		yargs.option("daemon", { default: undefined });
		yargs.option("help", { default: undefined });

		const help = (await yargs.getHelp())
			.replace(/\[\w+\]/g, (match) => match.replace(/./g, " "))
			.replace(/^\s{20,}$/gm, "");

		console.log(help);
	}
};
main().then(() => null);
