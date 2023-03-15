// import { useSelector, useDispatch } from "react-redux";
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Panel,
  PanelTitle,
} from 'src/components';
import {
  PrimaryButton,
  Modal,
} from 'src/components/ui';
import {
  Box,
  Typography,
} from "@mui/material";

type IArgs = {
  next: () => void;
  back: () => void;
  step: number;
  show: boolean;
  onClose: () => void;
  pages: any[];
  title: string;
  maxWidth?: number;
};

export function ModalWizard({next, back, step, show, onClose, pages, title, maxWidth: maxWidth = 500}: IArgs) {

  const Page = pages[step];
  return (
    <Modal
      id={"modal-wizard" + title}
      open={show}
      onClose={() => {
        onClose();
      }}
      maxWidth={`${maxWidth}`}
      minHeight="0"
      maxHeight="100%"
      headerText={title}
      PaperProps={{
        sx: {
          maxWidth: '1080px'
        }
      }}
    >
      <Box>
        <PanelTitle text={title} />
        {pages[step] ?
          typeof Page === 'function' ?
            Page({next, back}) :
            <Page {...{next, back}} />
          :
          undefined}
      </Box>
    </Modal>
  );
}