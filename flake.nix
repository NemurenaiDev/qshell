{
  description = ''
    qshell - a utility designed to pre-initialize your shell in the background
    and seamlessly attach to it when opening a new terminal,
    significantly reducing terminal time-to-ready.

    And btw, this flake building bad package:
    ❯ ./result/bin/qshell --help
    Pkg: Error reading from file.
  '';

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, gitignore, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        nodejs = pkgs.nodejs_18;

        node2nixOutput = import ./nix { inherit pkgs nodejs system; };
        nodeDeps = node2nixOutput.nodeDependencies;

        app = pkgs.stdenv.mkDerivation {
          name = "qshell";
          version = "0.2.0";

          src = gitignore.lib.gitignoreSource ./.;

          buildInputs = [ nodejs ];

          buildPhase = ''
            export PKG_NODE_PATH=./nix/node-v18.20.3-nix-linux-x64
            ln -sf ${nodeDeps}/lib/node_modules ./node_modules

            npm run build
            
            mkdir -p $out/bin
            cp ./build/qshell $out/bin/qshell
            chmod +x $out/bin/qshell
          '';
        };
      in with pkgs; {
        defaultPackage = app;
        devShell = mkShell { buildInputs = [ nodejs node2nix ]; };
      });
}
