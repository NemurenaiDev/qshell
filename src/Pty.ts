import assert from "node:assert";
import type { Socket } from "node:net";
import { homedir } from "node:os";
import { type IEvent, type IPty, spawn } from "node-pty";

export class Pty {
	private pty: IPty;

	OnExit: IEvent<{ exitCode: number; signal?: number }>;

	constructor(shell: string, term: string) {
		this.pty = spawn(shell, [], { name: term, cwd: homedir() });

		console.log(`PID:${this.pty.pid} PTY spawned`);

		this.pty.onExit(() => console.log(`PID:${this.pty?.pid} PTY exited`));
		this.OnExit = this.pty.onExit;
	}

	async Kill() {
		return new Promise((resolve) => {
			if (this.pty) {
				this.pty.onExit(resolve);
				this.pty.kill();
			} else {
				resolve(null);
			}
		});
	}

	Attach(id: string, ctlsock: Socket, rawsock: Socket, init?: string) {
		assert.ok(this.pty);

		const pid = this.pty.pid;

		ctlsock.on("data", (packet) => {
			const { cmd, data } = JSON.parse(packet.toString());
			if (cmd === "resize" && data.cols && data.rows) {
				this.pty.resize(data.cols, data.rows);
			} else {
				console.log(`PID:${pid} PTY ErrBadCmd: ${packet.toString()}`);
			}
		});

		rawsock.on("data", (data) => this.pty.write(data.toString()));
		this.pty.onData((data) => rawsock.write(data.toString()));

		ctlsock.on("close", () => console.log(`PID:${pid} ctlsock ${id} closed`));
		rawsock.on("close", () => console.log(`PID:${pid} rawsock ${id} closed`));

		ctlsock.on("close", () => rawsock.end());
		rawsock.on("close", () => ctlsock.end());

		this.pty.onExit(() => ctlsock.end());
		this.pty.onExit(() => rawsock.end());

		ctlsock.write(JSON.stringify({ cmd: "ATTACH" }));
		init && this.pty.write(`${init.trim()}\n`);

		console.log(`PID:${pid} PTY client ${id} connected`);
	}
}
