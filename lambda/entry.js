// lambda/index.js
exports.handler = async function (event) {
  console.log("Hello from dummy lambda 3 lat");
  return {
    statusCode: 200,
    body: "OK",
  };
};
