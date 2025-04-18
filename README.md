# qshell

qshell - a utility designed to pre-initialize your shell in the background and seamlessly attach to it when opening a new terminal, significantly reducing terminal time-to-ready.

```
Daemon mode
  -d, --daemon  Run in daemon mode which initializes PTY`s                      
  -i, --init    Exec cmd in every PTY after its initialization                  
  -p, --pool    Number of PTY`s to keep initialized                 [default: 3]
  -s, --shell   Shell to use in PTY`s                           [default: "zsh"]
  -t, --term    Sets XTERM value of PTY`s            [default: "xterm-256color"]
  -S, --sock    UNIX socket path to use            [default: "/tmp/qshell.sock"]

Client mode
  -a, --attach  Run in client mode: Attach to PTY initialized in daemon         
  -c, --cmd     Exec cmd in PTY after attaching to it                           
  -S, --sock    UNIX socket path to use            [default: "/tmp/qshell.sock"]

Options:
      --version  Show version number                                            
  -h, --help     Show help (this message)   
```