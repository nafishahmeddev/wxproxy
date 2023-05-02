export default function(req, res){
    return res.json({
        success:true,
        message: req.originalUrl
    })
}