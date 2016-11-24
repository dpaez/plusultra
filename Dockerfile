FROM node:6.9.1
ADD . /code
WORKDIR /code
RUN npm i
CMD ["npm", "start", "--", "--entranceHost=redis"]

