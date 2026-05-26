const Notification = require('../models/Notification')

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req,res)=>{
  try{
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if(!notification){
      return res.status(404).json({success:false, message:"Notification not found"});
    }
    return res.status(200).json({success:true, message:"Notification Deleted Successfully"});

  }
  catch(error){
    res.status(500).json({success:false, message:error.message});
  }
}

const deleteAllNotification = async (req,res)=>{
  try{
    await Notification.deleteMany();

    return res.status(200).json({success:true, message:"All the Notification are Deleted Successfully"});

  }
  catch(error){
    res.status(500).json({success:false, message:error.message});
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotification
};
