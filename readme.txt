1.Update Upgrade apt 
    sudo apt update &&  sudo apt upgrade

2.Install nginx
    sudo apt install nginx

    //*check if nginx is firewall enabled
    sudo ufw app list

    //*Check if nginx is running
    systemctl status nginx

3.Install curl
    sudo apt install curl

4.Install nvm and node
    curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
    source ~/.bashrc
    nvm install node

    //*update nvm 
    npm install -g npm@10.2.1

5.Install pm2
    npm install pm2@latest -g

6.Install git
    sudo apt-get install git-all

7.Clone repo
    git clone https://github.com/OscarHenrichs/smart_socket.git

8.Start pm2 service
    cd smart_socket
    pm2 start index.js

9.Config nginx

    {dns} : dev.websocket.smartcitizen.tec.br

    cd /etc/nginx/sites-available/

    sudo touch {dns}.conf

    sudo vim {dns}.conf 
    ------------------nginx-file-----------------------------
    map $http_upgrade $connection_upgrade {
      default upgrade;
      '' close;
   }

   server {
      listen 80;
      listen 8020;
      listen [::]:80;
      server_name dev.websocket.smartcitizen.tec.br;

      location / {
         proxy_pass "http://127.0.0.1:9001/";
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection $connection_upgrade;
      }
   }
    ---------------------------------------------------------
    sudo ln -s /etc/nginx/sites-available/{dns}.conf /etc/nginx/sites-enabled/{dns}.conf

    //sudo ln -s /etc/nginx/sites-available/dev.websocket.smartcitizen.tec.br.conf /etc/nginx/sites-enabled/dev.websocket.smartcitizen.tec.br.conf
    
    //Agora é necessário conectar o IP do servidor a URL da API. Isto é feito editando o arquivo
    //de hosts do Linux: /etc/hosts

    sudo vim /etc/hosts

    //Adicione a seguinte linha a esse arquivo:

    {ip} {dns}
    //3.228.84.201 dev.websocket.smartcitizen.tec.br
    

   
