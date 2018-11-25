const _ = require("lodash");
var moment = require("moment");
const Class = require("../models/Class");
const User = require("../models/Users");
const ClassRequest = require("../models/ClassRequest");
const RejectedRequest = require("../models/RejectedRequest");
const SystemError = require("../errors/SystemError");
const StudentError = require("../errors/StudentError");
var socket = require('socket.io-client')('http://localhost:3001/');
studentService = {};

studentService.getClasses = req => {
  return new Promise(function (resolve, reject) {
    Class.find({})
      .then(classes => {
        return resolve(classes);
      })
      .catch(err => {
        return reject(new SystemError.BusinessException());
      });
  });
};

studentService.getUserClasses = req => {
  return new Promise(function (resolve, reject) {
    Class.find({
        "students.schoolNumber": req.tokenData.schoolNumber
      })
      .then(res => {
        var result = res.map(x =>
          _.pick(x, [
            "_id",
            "managerId",
            "className",
            "joinTime",
            "quota",
            "discontinuity",
            "description",
            "managerName"
          ])
        );
        return resolve(result);
      })
      .catch(err => {

        return reject(SystemError.BusinessException(err));
      });
  });
};

studentService.joinClass = req => {
  return new Promise(function (resolve, reject) {
    ClassRequest.find({
        classId: req.params.id,
        studentId: req.tokenData.userId
    })
    .then(res => {
      if (res.length > 0)  //Check class for student request
        return reject(StudentError.StudentAlreadyRequested())

      RejectedRequest.find({
        classId: req.params.id,
        studentId: req.tokenData.userId
      }).then(rejected => {
        if (rejected.length > 0)  //Check class for student request
          return reject(StudentError.Rejected())
        
      Class.findOne({ _id: req.params.id }).then(classInstance => {
        var studentId = classInstance.students.find(student => student.userId === req.tokenData.userId) //Check class for student
        if (studentId) 
          return reject(StudentError.StudentAlreadyJoin())

        if(classInstance.quota == classInstance.students.length)  //Check class quota
          return reject(StudentError.ClassFull())

        User.findOne({ _id: req.tokenData.userId })
          .then(userInstance => {
            var classReq = new ClassRequest({
              'managerId': classInstance.managerId,
              'managerName': classInstance.managerName,
              'classId': req.params.id,
              'className': classInstance.className,
              'studentId': req.tokenData.userId,
              'studentName': userInstance.fullName,
              'studentNumber':req.tokenData.schoolNumber,
              'requestDate': moment().toDate()
            });

            classReq.save()
            .then(instance => {
              return resolve(instance);
            }).catch(err => {
              return reject(SystemError.BusinessException(err));
            })
          }).catch(err => {
            return reject(SystemError.BusinessException(err));
          })
        }).catch(err => {
          return reject(SystemError.BusinessException(err));
        })
      }).catch(err => {
        return reject(SystemError.BusinessException(err));
      })    
    }).catch(err => {
      return reject(SystemError.BusinessException(err));
    })
  })
};

studentService.joinRollCall = req => { //TODO Student classtamı kontrolu yapılacak
  return new Promise(function (resolve, reject) {
    var classId = req.params.classId; 
    var qhereId = req.params.qhereId;
    var studentId = req.tokenData.userId; 

    User.findOne({ _id: studentId }).then(userInstance => {
      Class.findOne({ _id: classId }).then(classInstance => {
        if(!(classInstance.students.find(student => student.userId == studentId))) //Check is user joined class
          return reject('User is not joined this class')

        var qhereInstance = classInstance.qheres.find(qhere => qhere._id == qhereId)
        
        if(qhereInstance.students.find(student => student._id == studentId)) //Check user is already joined roll call
          return reject('User is already joined rollcall')

        qhereInstance.students.push(userInstance);
        classInstance.qheres[qhereInstance.number - 1] = qhereInstance
        Class.findOneAndUpdate({ _id: classId }, {qheres: classInstance.qheres}, {new: true}).then(updatedClass => {
          socket.emit('approveClass',{ classId:classId, fullName:userInstance.fullName,schoolNumber:userInstance.schoolNumber });
          return resolve(updatedClass)
        }).catch(err => {
        console.log('err:', err)
        return reject(err)
        })
      }).catch(err => {
        console.log('err:', err)
        return reject(err)
      })
    }).catch(err => {
      console.log('err:', err)
      return reject(err)
    })
  })
};

module.exports = studentService;