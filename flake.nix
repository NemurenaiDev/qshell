{
  description = ''
    qshell - a utility designed to pre-initialize your shell in the background
    and seamlessly attach to it when opening a new terminal,
    significantly reducing terminal time-to-ready.
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
    let
      system = "x86_64-linux";
      
      pkgs = import nixpkgs { inherit system; };
      nodejs = pkgs.nodejs_18;

      node2nixOutput = import ./nix { inherit pkgs nodejs system; };
      nodeDeps = node2nixOutput.nodeDependencies;

      qshell = pkgs.stdenv.mkDerivation {
        name = "qshell";
        version = "0.2.0";
        dontStrip = true;

        src = gitignore.lib.gitignoreSource ./.;

        buildInputs = [ nodejs ];

        buildPhase = ''
          export PKG_NODE_PATH=./nix/node-v18.20.3-nix-linux-x64
          ln -sf ${nodeDeps}/lib/node_modules ./node_modules

          npm --offline run build

          mkdir -p $out/bin
          cp ./build/qshell $out/bin/qshell
          chmod +x $out/bin/qshell
        '';
      };
    in {
      packages.${system}.default = qshell;
      apps.${system}.qshell = {
        type = "app";
        program = "${builtins.toString qshell}/bin/qshell";
      };
    };
}
