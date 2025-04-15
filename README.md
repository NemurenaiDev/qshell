# qshell

qshell - a utility designed to pre-initialize your shell in the background and seamlessly attach to it when opening a new terminal, significantly reducing terminal time-to-ready.

```
Options:
      --help     Show help
      --version  Show version number
  -a, --attach   [boolean] [default: false]
  -d, --daemon   [boolean] [default: false]
  -p, --pool     [number]  [default: 3]
  -S, --sock     [string]  [default: "/tmp/qshell.sock"]
  -s, --shell    [string]  [default: "zsh"]
  -t, --term     [string]  [default: "xterm-256color"]
```