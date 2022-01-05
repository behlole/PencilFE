import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { localeData } from '@progress/kendo-angular-intl';
import { EventHandlerService } from 'src/app/paint/event-handler.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { finalize, map } from 'rxjs/operators';
import { Observable, of, pipe } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit {
  firestorePlacesCollection: AngularFireList<any>;
  aflCategories: any;
  user: any;
  userList: Array<any>;
  userdata = new UserCanvaData()
  canvaData: any;

  private basePath = '/uploads';
  currentFileUpload: FileUpload;
  filename: string;
  constructor(
    public authService: AuthService,
    private eventService: EventHandlerService,
    private afDb: AngularFireDatabase,
    private storage: AngularFireStorage,
  ) {


    this.firestorePlacesCollection = this.afDb.list('User');

    this.aflCategories = this.afDb.list('/User');
    this.aflCategories.valueChanges().subscribe(resutl => {
      this.userList = [];
      resutl.forEach((element: any, index) => {
        if (element.User != undefined && element.User.ShareEmail != undefined) {
          if (element.User.ShareEmail.filter(x => x.Email.toLowerCase() == JSON.parse(this.user).email.replace(/[^\w\s]/gi, '').toLowerCase())) {
            this.userList.push({ Email: element.User.UserId });
          }
        }
      });

    });
  }


  
  pushFileToStorage(fileUpload: FileUpload): Observable<number> {
    const filePath = `${this.basePath}/${fileUpload.file.name}`;
    const storageRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, fileUpload.file);

    uploadTask.snapshotChanges().pipe(
      finalize(() => {
        storageRef.getDownloadURL().subscribe(downloadURL => {
        this.canvaData = downloadURL;
          this.Addemail(undefined);
        });
      })
    ).subscribe();

    return uploadTask.percentageChanges();
  }

  ngOnInit() {
    this.filename= this.getNewKey()
    this.user = localStorage.getItem("user");
    this.userdata.ShareEmail = [];
    this.Addemail(undefined);

    this.eventService.canvaData.subscribe(resutl => {
      debugger;
      this.canvaData = resutl;
      if(this.canvaData){
      const base64 = resutl;
      const imageName = this.filename+'.png';
      const imageBlob = this.dataURItoBlob(base64, imageName);
      const imageFile = new File([imageBlob], imageName, { type: 'image/png' });
      this.currentFileUpload = new FileUpload(imageFile)  
      this.pushFileToStorage(this.currentFileUpload);
      //this.Addemail(undefined);
      }
    });
  }
  getNewKey() {
    let key = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return key
}
  dataURItoBlob(dataURI : any, fileName : string) : File{

    // convert base64/URLEncoded data component to a file
    var byteString;
   if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
   else
       byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
       ia[i] = byteString.charCodeAt(i);
    }

    return new File([ia],fileName, {type:mimeString});
}


  Addemail(email) {
    this.userdata.UserId = JSON.parse(this.user).email.replace(/[^\w\s]/gi, '').toLowerCase();
    this.userdata.CanvaData = this.canvaData || "";
    if (email) {
      var shareEmail = new ShareEmail()
      shareEmail.Email = email.replace(/[^\w\s]/gi, '').toLowerCase();
      this.userdata.ShareEmail.push(shareEmail)
    }
    this.addCanvaonfireBase(this.userdata);
  }


  addCanvaonfireBase(user: UserCanvaData) {
    this.firestorePlacesCollection.update(user.UserId.replace(/[^\w\s]/gi, '').toLowerCase(), {
      User: user
    });
  }


  SubcribeDate(email) {
    let Email = email.replace(/[^\w\s]/gi, '').toLowerCase();
    var fiForUserSub = this.afDb.list("/User/" + Email);
    fiForUserSub.valueChanges().subscribe((resutl: any) => {
      this.eventService.AddDataOnCanvaUser(resutl[0].CanvaData)
      this.eventService.ChangeValur(true);
    });
  }


}

export class UserCanvaData {
  UserId: any;
  CanvaData: any;
  ShareEmail: Array<ShareEmail>;
}
export class ShareEmail {
  Email: any;
}
export class FileUpload {
  key: string;
  name: string;
  url: string;
  file: File;

  constructor(file: File) {
    this.file = file;
  }
}