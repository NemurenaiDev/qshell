import { createConnection } from "node:net";

export class PtyClient {
	private id = `${Date.now()}-${process.hrtime.bigint().toString().slice(-6)}`;
	private ctlsock;
	private rawsock;

	constructor(sockpath: string) {
		this.ctlsock = createConnection(sockpath);
		this.rawsock = createConnection(sockpath);
	}

	async Connect() {
		return new Promise((resolve, reject) => {
			this.ctlsock.once("data", (packet) => {
				const { cmd } = JSON.parse(packet.toString());
				if (cmd === "ATTACH") {
					resolve(true);
				}
			});
			this.ctlsock.write(`ctl:${this.id}`);
			this.rawsock.write(`raw:${this.id}`);
		});
	}

	async Attach() {
		const { stdin, stdout } = process;

		// stdout.write("\x1b[?1049h");
		stdin.setRawMode(true);
		stdin.resume();

		this.ctlsock.on("close", () => {
			// stdout.write("\x1b[?1049l");
			stdin.setRawMode(false);
			stdin.pause();
		});

		this.ctlsock.on("close", () => this.rawsock.end());
		this.rawsock.on("close", () => this.ctlsock.end());

		const SendStdoutSize = () => {
			this.ctlsock.write(
				JSON.stringify({
					cmd: "resize",
					data: {
						cols: stdout.columns,
						rows: stdout.rows,
					},
				}),
			);
		};
		SendStdoutSize();
		stdout.on("resize", SendStdoutSize);

		stdin.on("data", (data) => this.rawsock.write(data.toString()));
		this.rawsock.on("data", (packet) => stdout.write(packet.toString()));
	}

	Kill() {
		this.ctlsock.end();
	}

	GetId() {
		return this.id;
	}
}
