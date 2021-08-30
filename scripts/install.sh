sudo apt-get install unzip
curl -fsSL https://deno.land/x/install/install.sh | sh
echo "export DENO_INSTALL=\"/root/.deno\"" >> ~/.bash_profile
echo "PATH=\"$DENO_INSTALL/bin:$PATH"\" >> ~/.bash_profile
source ~/.bash_profile
deno install -qAf --unstable https://deno.land/x/denon/denon.ts
