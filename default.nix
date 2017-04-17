{ surfstick-cli ? { outPath = ./.; name = "surfstick-cli"; }
, pkgs ? import <nixpkgs> {}
}:
let
  nodePackages = import "${pkgs.path}/pkgs/top-level/node-packages.nix" {
    inherit pkgs;
    inherit (pkgs) stdenv nodejs fetchurl fetchgit;
    neededNatives = [ pkgs.python ] ++ pkgs.lib.optional pkgs.stdenv.isLinux pkgs.utillinux;
    self = nodePackages;
    generated = ./nix-deps.nix;
  };
in rec {
  tarball = pkgs.runCommand "surfstick-cli-1.0.0.tgz" { buildInputs = [ pkgs.nodejs ]; } ''
    mv `HOME=$PWD npm pack ${surfstick-cli}` $out
  '';
  build = nodePackages.buildNodePackage {
    name = "surfstick-cli-1.0.0";
    src = [ tarball ];
    buildInputs = nodePackages.nativeDeps."surfstick-cli" or [];
    deps = [ nodePackages.by-spec."lodash"."^4.17.4" ];
    peerDependencies = [];
  };
}