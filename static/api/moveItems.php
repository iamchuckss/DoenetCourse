<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

include "db_connection.php";

$jwtArray = include "jwtArray.php";
$userId = $jwtArray['userId'];

$_POST = json_decode(file_get_contents("php://input"),true); 

$sourceDriveId = mysqli_real_escape_string($conn,$_POST["selectedNodes"]["driveId"]); 
$destinationDriveId = mysqli_real_escape_string($conn,$_POST["destinationObj"]["driveId"]); 
$destinationParentFolderId = mysqli_real_escape_string($conn,$_POST["destinationObj"]["parentFolderId"]); 

$success = FALSE;
$sql = "
SELECT canMoveItemsAndFolders
FROM drive_user
WHERE userId = '$userId'
AND driveId = '$sourceDriveId'
";
$result = $conn->query($sql); 
$canMoveSource = FALSE;
if ($result->num_rows > 0){
$row = $result->fetch_assoc();
$canMoveSource = $row["canMoveItemsAndFolders"];
}

if ($destinationDriveId == $sourceDriveId){
  $canAddDesination = TRUE;
}else{
  $sql = "
  SELECT canAddItemsAndFolders
  FROM drive_user
  WHERE userId = '$userId'
  AND driveId = '$destinationDriveId'
  ";
  $result = $conn->query($sql); 
  $canAddDesination = FALSE;
  if ($result->num_rows > 0){
  $row = $result->fetch_assoc();
  $canAddDesination = $row["canAddItemsAndFolders"];
  }
}

if ($canAddDesination && $canMoveSource){
  $success = TRUE;
$number_items = count($_POST["selectedNodes"]["selectedArr"]);
$new_values = "";
for ($i = 0; $i < $number_items; $i++) {
  $parentFolderId =  mysqli_real_escape_string($conn,$_POST["selectedNodes"]["selectedArr"][$i]["parentFolderId"]);
  $itemId =  mysqli_real_escape_string($conn,$_POST["selectedNodes"]["selectedArr"][$i]["nodeId"]);
  $type =  mysqli_real_escape_string($conn,$_POST["selectedNodes"]["selectedArr"][$i]["type"]);
  $new_values = $new_values . "('$destinationDriveId','$destinationParentFolderId','$itemId'),";
}
$new_values = rtrim($new_values,",");

$sql = "INSERT INTO drive_content (driveId,parentFolderId,itemId)
        VALUES ";
$sql = $sql . $new_values;
$sql = $sql . " ON DUPLICATE KEY UPDATE 
driveId = VALUES(driveId),
parentFolderId = VALUES(parentFolderId) ";

$result = $conn->query($sql); 
}else{
  $success = FALSE;
}
$response_arr = array( 
    "success" => $success,
   );

 // set response code - 200 OK
 http_response_code(200);


     

 // make it json format
 echo json_encode($response_arr);



$conn->close();


?>
           
