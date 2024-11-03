const decodeBase64 = (encoded) => {
       return new Uint8Array(atob(encoded)
           .split('')
           .map((c) => c.charCodeAt(0)));
   };

   const decode = (input) => {
       try {
           return decodeBase64(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
       }
       catch (_a) {
           throw new TypeError('The input to be decoded is not correctly encoded.');
       }
   }
   function Uint8ToString(u8a){
     var CHUNK_SZ = 0x8000;
     var c = [];
     for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
       c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
     }
     return c.join("");
   }


   function bufferToBase64url (buffer) {


       const byteView = new Uint8Array(buffer);
       let str = "";
       for (const charCode of byteView) {
           str += String.fromCharCode(charCode);
       }


       const base64String = btoa(str);

       const base64urlString = base64String.replace(/\+/g, "-").replace(
           /\//g,
           "_",
       ).replace(/=/g, "");
       return base64urlString;
   }

   function bytesToBase64(bytes) {
     const binString = Array.from(bytes, (byte) =>
       String.fromCodePoint(byte),
     ).join("");
     return btoa(binString);
   }

   const signBtn = document.getElementById("sign-btn");
   signBtn.onclick = e => {

     const usernameTb = document.getElementById("username");
     const username = usernameTb.value

     console.log('create cred');
     const randomStringFromServer = "this-is-enable-webauthn-12345678"
     const publicKeyCredentialCreationOptions = {
         challenge: Uint8Array.from(
             randomStringFromServer, c => c.charCodeAt(0)),
         rp: {
             name: "Kt Sample",
             id: "localhost",
         },
         user: {
             id: Uint8Array.from(username, c => c.charCodeAt(0)),
             name: username,
             displayName: username,
         },
         pubKeyCredParams: [
           {alg: -7, type: "public-key"},
           {alg: -257, type: "public-key"}
         ],
         excludeCredentials: [],
         authenticatorSelection: {
           residentKey: "preferred",
           requireResidentKey: true,
           userVerification: "preferred"
         },
         timeout: 60000,
         attestation: "none",
         hints: [
         ],
         type: "public-key",
         extensions: {
           credProps: {}
         }
     };

     const payload = {id : "pawan.rajput@localhost"}
     fetch("http://localhost:9898/api/v1/account/register", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload)
     })
       .then(res => res.json())
       .then(res => {
         console.log({"challenge": res.challenge, "userId": res.user.id})
         publicKeyCredentialCreationOptions.challenge = Uint8Array.from(res.challenge, c => c.charCodeAt(0))
         console.log('res', (publicKeyCredentialCreationOptions));
         navigator.credentials.create({
             publicKey: publicKeyCredentialCreationOptions
         }).then((cdRes) => {
             console.log(cdRes)
             console.log(JSON.stringify(cdRes));
             const pusername = username
             console.log("username", pusername);
             console.log("cdRes", cdRes.response.getPublicKey())
             console.log("cdRes", cdRes.response.getAuthenticatorData())
             const userCreds = {
               attestationObject: bufferToBase64url(cdRes.response.attestationObject),
               clientDataJSON: bufferToBase64url(cdRes.response.clientDataJSON),
               publicKey: bufferToBase64url(cdRes.response.getPublicKey()),
               authenticatorData: bufferToBase64url(cdRes.response.getAuthenticatorData()),
               id: cdRes.id,
               authenticatorAttachment: cdRes.authenticatorAttachment,
               transports: cdRes.response.getTransports(),
               publicKeyAlgorithm: cdRes.response.getPublicKeyAlgorithm(),
             }
             console.log("user cred", userCreds);
             const vpayload = {name: pusername, userCreds: userCreds }
             fetch('http://localhost:9898/api/v1/account/finishAuth', {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(vpayload)
             }).then(eres => eres.json())
             .then(result => {
               console.log('result', result);
               if (result.login == "complete") {
                 const msg = result.username + " user registration complete";
                 alert(msg)
               } else {
                 alert("Login Failed")
               }
             });
         });
       });

     return;

     console.log(publicKeyCredentialCreationOptions)
     navigator.credentials.create({
         publicKey: publicKeyCredentialCreationOptions
     }).then(credential => {
         console.log(credential)
         console.log(JSON.stringify(credential));
     });
};

   const loginBtn = document.getElementById("login-btn");

   const usernameTb = document.getElementById("username");
   loginBtn.onclick = e => {

     fetch("http://localhost:9898/api/v1/account/userOptions", {
       "method": "POST",
       "headers": {
         "Content-Type": "application/json"
       },
       "body": JSON.stringify({"username": usernameTb.value})
     }).then(r => r.json()).then(res => {
       // const challenge = "9ARJazmbMCdPNXIIhLHxKuRWte_u6pEvyF_m3WQrprhw1JCoRaTu8oip4opMFOP_JPKxAhPw9b5kbXTWLSD8Zg"
       const challenge = res["challenge"]
       const users = res["users"]
       console.log("users", users)
       const allowCredentials = users.map(u => ({
         "id": decode(u["id"]),
         "type": "public-key",
         "transports": [u["transports"].split(",")]
       }));
       const pubKeyCredReqOpts = {
         "challenge": Uint8Array.from(challenge, c => c.charCodeAt(0)),
         // "allowCredentials": allowCredentials,
         "allowCredentials": [],
         "rpId": "localhost",
         "timeout": 60000,
         "userVerification": "preferred"
       }

       console.log("req", pubKeyCredReqOpts);
       navigator.credentials.get({publicKey: pubKeyCredReqOpts}).then(assertion => {
         console.log("credentials.get")
         console.log("assertion", assertion)
         console.log(JSON.stringify(assertion))
         const username = usernameTb.value;
         const textDecoder = new TextDecoder('utf8');
         const id = assertion.id
         const clientDataJSON = btoa(textDecoder.decode(assertion.response.clientDataJSON))
         console.log({clientDataJSON})
         const textDecoder2 = new TextDecoder('ISO-8859-2');
         console.log(new Uint8Array(assertion.response.authenticatorData));
         console.log(bufferToBase64url(assertion.response.authenticatorData));
         const decodeAD = textDecoder.decode(new Uint8Array(assertion.response.authenticatorData));
         console.log({decodeAD});
         const authenticatorData = bufferToBase64url(assertion.response.authenticatorData);
         const signature = bufferToBase64url(assertion.response.signature);
         const userHandle = bufferToBase64url(assertion.response.userHandle);
         const userCreds = {
           clientDataJSON: clientDataJSON,
            authenticatorData: authenticatorData,
             signature: signature,
              userHandle: userHandle,
              id: id
              };
         const loginreq = {name: username, userCreds: userCreds }
         console.log('loginreq', loginreq);
         fetch("http://localhost:9898/api/v1/account/login", {
           "method": "POST",
           "headers": { "Content-Type": "application/json" },
           "body": JSON.stringify(loginreq)
         }).then(e => e.json()).then(lr => {
           console.log('login res', lr);
           if (lr["login"] === "complete"){
             alert("login done " + lr["username"])
           } else {
             alert("login fail")
           }
         })

       }).catch(err => console.error("error in cred", err));

     })
     return;
     const randomStringFromServer = usernameTb.value + "_userfor1000"
     const credentialId = "UZSL85T9AFC";
     const publicKeyCredentialRequestOptions = {
         challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0)),
         allowCredentials: [],
         rpId: "localhost",
         timeout: 60000,
     }

     console.log(publicKeyCredentialRequestOptions)

     navigator.credentials.get({
         publicKey: publicKeyCredentialRequestOptions
     }).then(assertion => {
       console.log(assertion);
       console.log(assertion.id);
       console.log(assertion.response)
       console.log(JSON.stringify(assertion.response))
       console.log(assertion.response.clientDataJSON)
       console.log(JSON.stringify(assertion.response.clientDataJSON))
       console.log(assertion.response.authenticatorData)
       console.log(JSON.stringify(assertion.response.authenticatorData))
       console.log(JSON.stringify(assertion));
       alert('login Done!!')
     });


   };
