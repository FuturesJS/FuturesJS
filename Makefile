all: npm browser

node:
	cp -a ./lib ~/.node_libraries/futures

browser:
	./mkfutures.sh

npm:
	npm install futures
