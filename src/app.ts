import { existsSync, unlinkSync } from "node:fs";
import { argv } from "node:process";
import { Daemon } from "./Daemon";
import { PtyClient } from "./PtyClient";

const ctlsock = "/tmp/qshell.ctlsock";
const rawsock = "/tmp/qshell.rawsock";

const main = async () => {
	if (argv.includes("--daemon")) {
		if (existsSync(ctlsock)) {
			unlinkSync(ctlsock);
		}
		if (existsSync(rawsock)) {
			unlinkSync(rawsock);
		}

		const daemon = new Daemon(ctlsock, rawsock);

		await daemon.Start();

		process.on("SIGINT", () => daemon.Stop());
		process.on("SIGTERM", () => daemon.Stop());
	} else if (argv.includes("--attach")) {
		const client = new PtyClient(ctlsock, rawsock);
        
		await client.Connect();
		await client.Attach();

		process.title = `qshell-${client.GetId()}`;
		process.on("SIGINT", () => client.Kill());
		process.on("SIGTERM", () => client.Kill());
	} else {
		console.log("Bad usage");
	}
};
main().then(() => null);
