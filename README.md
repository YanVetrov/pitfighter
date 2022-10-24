# pitfighter

## LINKS
https://pitfighter.io/ -  promo landing
https://pitfighter.io/game - farm game (branch farm)

## RU

2 игры, основанных на Vue.js (интерфейс) и сanvas WebGL (pixi.js), каждая имеет свой бекенд основанный на node.js: express.js, socket.io,passport.js.

1 лендинг промо сайт с фичами и дизайном основан на vue.js.

Игры:
1. ветка master.  Cессионная пошаговая 1х1 боевка. Перед началом необходимо собрать свой сквад до 6 бойцов, нажать кнопку готов и ждать пока другой игрок сделает тоже самое (вы можете играть вторым игроком через другую вкладку). Также доступен режим спектатора, просто поделитесь ссылкой с другими людьми. В игре использованы ассеты находящиеся в свободном доступе для коммерческого и некоммерческого использования.
2. Ветка farm. Базовая ферма со сбором ресурсов постройками и юнитами для их охраны. На первом экране вас встречает форма логина и пароля которая одновременно и регистрация(если пользователя не существует). Далее в игре присутствует туториал который (я надеюсь) даст вам понять механику игры.  !!!В игре присутсвуют ассеты только для некоммерческого использования!!!

Существует проблема (CORS'ов) паралельного запуска серевров. К примеру основной игровой сервер localhost:8080, и клиентский webpack dev-server на localhost:3000
Проблема в passport.js и последних апдейтов хрома. Частично можно решить расширениями.

Процесс сборки
1. в папках root, client, landing подтяните все npm зависимости
2. запустите node index.js 
3. localhost:8080/ - лендинг,  localhost:8080/game - игра

## ENG

2 games based on Vue.js (interface) and canvas WebGL (pixi.js), each has its own backend based on node.js: express.js, socket.io,passport.js.

1 landing promo site with features and design is based on vue.js .

Games:
1. the master branch. Session turn-based 1x1 action game. Before you start, you need to choose your squad of up to 6 fighters, press the ready button and wait for the other player to do the same (you can play the second player through another tab). The spectator mode is also available, just share the link with other people. The game uses assets that are freely available for commercial and non-commercial use.
2. Farm branch. A base farm with resource collection buildings and units for their protection. On the first screen, you are greeted by a login and password form that is both registration (if the user does not exist). Next in the game there is a tutorial that (I hope) will give you an understanding of the mechanics of the game. **!!!The game contains assets only for non-commercial use!!!**

There is a problem (CORS's) of parallel launch of serevs. For example, the main game server localhost:8080, and the client webpack dev-server on localhost:3000
The problem is in passport.js and the latest chrome updates. Partially it can be solved by extensions.

The BUILD process
1. in the root, client, landing folders, pull up all npm dependencies
2. run node index.js
3. localhost:8080/ - landing, localhost:8080/game - game
