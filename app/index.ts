import app from './app'

// Use Port 3000 as default
const port = process.env.PORT || 3000

// Get our server running! 
app.listen(port, () => { 
	return console.log(`server is listening on ${port}`) 
});

module.exports = app;