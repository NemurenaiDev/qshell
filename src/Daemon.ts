import { type Socket, createServer } from "node:net";
import { Pty } from "./Pty";

export type DaemonOptions = {
	shell: string;
	term: string;
	pool: number;
};

export class Daemon {
	private initialized = new Array<Pty>();
	private connected = new Set<Pty>();
	private clients = new Map<string, { ctlsock?: Socket; rawsock?: Socket }>();
	private server = createServer();

	constructor(
		private sockpath: string,
		private options: DaemonOptions,
	) {
		for (let index = 0; index < this.options.pool; index++) {
			this.initialized.push(this.MakePty());
		}
	}

	private MakePty() {
		return new Pty(this.options.shell, this.options.term);
	}

	private Attach(id: string, ctlsock: Socket, rawsock: Socket) {
		const pty = this.initialized.shift() ?? this.MakePty();

		pty.Attach(id, ctlsock, rawsock);

		pty.OnExit?.call(this, () => this.connected.delete(pty));
		pty.OnExit?.call(this, () => this.clients.delete(id));

		ctlsock.on("close", () => pty.Kill());
		rawsock.on("close", () => pty.Kill());

		this.connected.add(pty);
		this.initialized.push(this.MakePty());
	}

	Start() {
		return new Promise((resolve) => {
			this.server.on("connection", (sock) => {
				sock.once("data", (data) => {
					const handshakeRegex = /^(ctl|raw):\d{12,14}-\d{6}$/;
					const packet = data.toString();

					if (!handshakeRegex.test(packet)) {
						console.log(`Bad handshake packet: ${packet}`);
						return sock.end();
					}

					const [type, id] = packet.split(":");

					if (!this.clients.has(id)) {
						this.clients.set(id, {});
					}
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					const socks = this.clients.get(id)!;

					if (type === "ctl") {
						socks.ctlsock = sock;
					} else {
						socks.rawsock = sock;
					}
					this.clients.set(id, socks);

					if (socks.ctlsock && socks.rawsock) {
						this.Attach(id, socks.ctlsock, socks.rawsock);
					}
				});
			});

			this.server.listen(this.sockpath, () => resolve(null));
		});
	}

	Stop() {
		return Promise.all([
			Promise.all(this.initialized.map((pty) => pty.Kill())),
			Promise.all(Array.from(this.connected).map((pty) => pty.Kill())),

			new Promise((resolve) => this.server.close(() => resolve(null))),
		]);
	}
}
