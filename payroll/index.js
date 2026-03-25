document.getElementById("login").addEventListener("click", () => {
   const userInput = document.getElementById("inputUser");
   const passInput = document.getElementById("inputPass");
   if (!userInput) return;           // guard in case the element is missing
   if (!passInput) return;           // guard in case the element is missing

   const valueUser = userInput.value;
   const valuePass = passInput.value
   const username = "admin";
   const password = "1234";
   if (valueUser == "" || valuePass == "") {
      alert("กรุณากรอกข้อมูล")
   }
   else if (valueUser !== username || valuePass !== password) {
      alert("ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง");
   } else {
      alert("เข้าสู่ระบบสำเร็จ");

      window.location.href="../payroll/payroll/payroll.html"
   }
});