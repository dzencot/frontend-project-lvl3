install:
	npm install

lint:
	npx eslint ./

test:
	npm test

test-watch:
	npm run test-watch

check-all:
	make lint
	make test

build:
	rm -rf dist
	npm run build

build-debug:
	DEBUG="rss-reader:*" npx build

deploy:
	npx -c "surge -p dist -d petite-bead.surge.sh"

publish:
	npm publish

.PHONY: test
