import { type Socket, createServer } from "node:net";
import { Pty } from "./Pty";

export class Daemon {
	private initialized = new Array<Pty>();
	private connected = new Set<Pty>();
	private ctlServer = createServer();
	private rawServer = createServer();
	private clients = new Map<string, { ctlsock?: Socket; rawsock?: Socket }>();
	private shell = "zsh";

	constructor(
		private ctlsockPath: string,
		private rawsockPath: string,
		private ptyPoolSize = 3,
	) {
		for (let index = 0; index < this.ptyPoolSize; index++) {
			this.initialized.push(this.MakePty());
		}
	}

	private MakePty() {
		return new Pty(this.shell);
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
			const handshake = (sock: Socket, type: "ctlsock" | "rawsock") => {
				sock.once("data", (data) => {
					const id = data.toString();

					if (/\d{13}-\d{9}/.test(id)) {
						if (!this.clients.has(id)) {
							this.clients.set(id, {});
						}
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						const socks = this.clients.get(id)!;

						socks[type] = sock;
						this.clients.set(id, socks);

						if (socks.ctlsock && socks.rawsock) {
							this.Attach(id, socks.ctlsock, socks.rawsock);
						}
					} else {
						sock.end();
					}
				});
			};
			this.ctlServer.on("connection", (sock) => handshake(sock, "ctlsock"));
			this.rawServer.on("connection", (sock) => handshake(sock, "rawsock"));

			this.ctlServer.listen(this.ctlsockPath, () => resolve(null));
			this.rawServer.listen(this.rawsockPath, () => resolve(null));
		});
	}

	Stop() {
		return Promise.all([
			Promise.all(this.initialized.map((pty) => pty.Kill())),
			Promise.all(Array.from(this.connected).map((pty) => pty.Kill())),
			new Promise((resolve) => this.ctlServer.close(() => resolve(null))),
			new Promise((resolve) => this.rawServer.close(() => resolve(null))),
		]);
	}
}
