import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';
import 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAzckOAN5b5jzQuMy1r88iriUMych-KUC4",
    authDomain: "personaphile-staging.firebaseapp.com",
    databaseURL: "https://personaphile-staging.firebaseio.com",
    projectId: "personaphile-staging",
    storageBucket: "personaphile-staging.appspot.com",
    messagingSenderId: "563800936244",
    appId: "1:563800936244:web:fb52b4525da81751ea5f61",
    measurementId: "G-2JRNEGSQG6"
};

firebase.initializeApp(firebaseConfig);
// firebase.firestore().settings({ timestampsInSnapshots: true });
firebase.firestore()
firebase.functions()
firebase.auth();

export default firebase;