{
  description = ''
    qshell - a utility designed to pre-initialize your shell in the background 
    and seamlessly attach to it when opening a new terminal, 
    significantly reducing terminal time-to-ready.
  '';

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        nodeApp = pkgs.stdenv.mkDerivation {
          pname = "qshell";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [
            pkgs.nodejs_18
            pkgs.nodePackages.npm
            pkgs.nodePackages.pkg
            pkgs.nodePackages.typescript
            pkgs.nodePackages.bytenode
            pkgs.nodePackages.node-gyp
            pkgs.python3
          ];

          buildPhase = ''
            export HOME=$TMPDIR
            npm install
            npm run build:prepare
            npm run build
          '';

          installPhase = ''
            mkdir -p $out/bin
            cp build/release/qshell $out/bin/
          '';
        };
      in {
        packages.default = nodeApp;
        packages.qshell = nodeApp;

        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.nodejs_18 pkgs.nodePackages.npm ];
        };
      });
}
