import { existsSync, unlinkSync } from "node:fs";
import Yargs from "yargs";
import { Daemon } from "./Daemon";
import { PtyClient } from "./PtyClient";

const sockpath = "/tmp/qshell.sock";

const yargs = Yargs(process.argv.slice(2))
	.option("attach", { type: "boolean", alias: "a", default: false })
	.option("daemon", { type: "boolean", alias: "d", default: false })
	.option("shell", { type: "string", alias: "s", default: "zsh" })
	// is there any need for passing, for example, xterm-kitty?
	.option("term", { type: "string", alias: "t", default: "xterm-256color" })
	.option("pool", { type: "number", alias: "p", default: 3 });
const argv = yargs.parseSync();

const main = async () => {
	if (argv.daemon) {
		if (existsSync(sockpath)) {
			unlinkSync(sockpath);
		}

		const daemon = new Daemon(sockpath, argv);

		await daemon.Start();

		process.on("SIGINT", () => daemon.Stop());
		process.on("SIGTERM", () => daemon.Stop());
	} else if (argv.attach) {
		const client = new PtyClient(sockpath);

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
