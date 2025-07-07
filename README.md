# qshell

qshell - a utility designed to pre-initialize your shell in the background and seamlessly attach to it when opening a new terminal, significantly reducing terminal time-to-ready.

## Known issues:
- Some control sequences appear to be lost, leading to incorrect tmux render when using side panes. For example, when using right pane cursor, user input, commands output and autosuggestions stays renders on the right pane correctly but the prompt stays on the left pane and "clear" cmd affects both panes. Overall, there is many render issues with the horizontal panes. Not sure how to fix it yet.

##

```
Daemon mode
  -d, --daemon  Run in daemon mode which initializes PTY`s                      
  -f, --force   Delete socket file if its already exists                        
  -i, --init    Exec cmd in every PTY after its initialization                  
  -p, --pool    Number of PTY`s to keep initialized                 [default: 3]
  -s, --shell   Shell to use in PTY`s                           [default: "zsh"]
      --term    Sets XTERM value of PTY`s            [default: "xterm-256color"]
      --sock    UNIX socket path to use       [default: "/tmp/qshell.user.sock"]

Client mode
  -a, --attach  Run in client mode: Attach to PTY initialized in daemon         
  -c, --cmd     Exec cmd in PTY after attaching to it                           
      --sock    UNIX socket path to use       [default: "/tmp/qshell.user.sock"]

Options:
      --version  Show version number                                            
  -h, --help     Show help (this message)  
```