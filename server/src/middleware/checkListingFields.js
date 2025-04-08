// middleware to check if the required fields are provided
// and rate is a number
const checkListingFields = (req,res,next) => {
    const{title, category, description,rate} = req.body;

    if(!title || !category || !description){
        return res.status(400).json({message : "Missing required fields"});
    }

    if( isNaN(parseFloat(rate)) ){
        return res.status(400).json({message : "Rate must be a valid number"});
    }

    // next middleware
    next();
}

module.exports = checkListingFields;