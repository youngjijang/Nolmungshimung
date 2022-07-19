import React, { useState } from "react";

// const spotDetail = () => {
//   const [InputText, setInputText] = useState("");
//   const onchangeText = (event) => {
//     setInputText(event.target.value);
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     console.log(InputText);
//     searchPlace(InputText);
//   };
async function SpotDetail(data) {
  return new Promise((resolve, reject) => {
    fetch(`https://${process.env.REACT_APP_SERVER_IP}:8443/travel/place`, {
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      // credentials: "include",
      body: JSON.stringify({ data }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          console.log("Sign In Success");
          console.log(res.data);
          resolve(res.data);
        } else {
          console.log("400에러 왜...............");
          resolve({
            reviews: [[0]],
            img: "",
          });
        }
      })
      .catch((err) => reject(err));
  });
}
// return (
//   <div>
//     <form onSubmit={handleSubmit}>
//       <input value={InputText} onChange={onchangeText} />
//       <button value="검색" type="submit">
//         검색
//       </button>
//     </form>
//   </div>
// );
// };

export default SpotDetail;