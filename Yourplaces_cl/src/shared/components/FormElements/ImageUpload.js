import React, { useRef, useState, useEffect } from "react";

import Button from "./Button";
import "./ImageUpload.css";

// useref = store values that survive rerender cycles (image)
const ImageUpload = (props) => {
  const [file, setFile] = useState();
  const [previewUrl, setPreviewUrl] = useState(props.preview);
  const [isValid, setIsValid] = useState(false);
  const filePickerRef = useRef();

  useEffect(() => {
    //set preview
    if (!file) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]); //cambia de estado cuanddo el archivo cambia

  const pickHandler = (event) => {
    let pickedFile;
    let fileIsValid = isValid; // hasta que no termina no cambia el estado,se hace manual

    if (event.target.files || event.target.files.lenght === 1) {
      pickedFile = event.target.files[0];

      setFile(pickedFile);
      setIsValid(true);
      fileIsValid = true;
    } else {
      setIsValid(false);
      fileIsValid = false;
    }

    props.onInput(props.id, pickedFile, fileIsValid); //
  };

  const pickImageHandler = () => {
    // utilizarlo sin verlo
    filePickerRef.current.click();
  };

  return (
    <div className="form-control">
      <input
        id={props.id}
        ref={filePickerRef}
        style={{ display: "none" }}
        type="file"
        accept=".jpg,.png,.jpeg"
        onChange={pickHandler}
      />
      <div className={`image-upload ${props.center && "center"}`}>
        <div className="image-upload__preview">
        
          {previewUrl && <img src={previewUrl} alt="Preview" />}
          {!previewUrl  && <p> Please, pick and image</p>}
        </div>
        <Button type="button" onClick={pickImageHandler}>
          Pick an Image
        </Button>
      </div>
      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImageUpload;
