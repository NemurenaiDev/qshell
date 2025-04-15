import { existsSync, unlinkSync } from "node:fs";
import Yargs from "yargs";
import { Daemon } from "./Daemon";
import { PtyClient } from "./PtyClient";

const yargs = Yargs(process.argv.slice(2))
	.option("attach", { type: "boolean", alias: "a", default: false })
	.option("daemon", { type: "boolean", alias: "d", default: false })
	.option("pool", { type: "number", alias: "p", default: 3 })
	.option("sock", { type: "string", alias: "S", default: "/tmp/qshell.sock" })
	.option("shell", { type: "string", alias: "s", default: "zsh" })
	// is there any need for passing, for example, xterm-kitty?
	.option("term", { type: "string", alias: "t", default: "xterm-256color" })
const argv = yargs.parseSync();

const main = async () => {
	if (argv.daemon) {
		if (existsSync(argv.sock)) {
			unlinkSync(argv.sock);
		}

		const daemon = new Daemon(argv.sock, argv);

		await daemon.Start();

		process.on("SIGINT", () => daemon.Stop());
		process.on("SIGTERM", () => daemon.Stop());
	} else if (argv.attach) {
		const client = new PtyClient(argv.sock);

		await client.Connect();
		await client.Attach();

		process.title = `qshell-${client.GetId()}`;
		process.on("SIGINT", () => client.Kill());
		process.on("SIGTERM", () => client.Kill());
	} else {
		console.log(await yargs.getHelp());
	}
};
main().then(() => null);
