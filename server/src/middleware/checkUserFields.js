const checkUserFields = (req,res,next) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        return res.status(400).json({ message : "Missing required fields "});
    }

    next();
}

module.exports = checkUserFields;