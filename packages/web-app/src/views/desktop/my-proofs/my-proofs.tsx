import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";
import { useCallback, useEffect, useState } from 'react';
import {
  error
} from 'src/slices';

import {
  useNavigate,
} from "react-router-dom";

import {
  useCCDContext,
} from 'src/hooks';

import {
  Button,
  LoadingIndicator,
  PrimaryButton,
  SecondaryButton,
} from 'src/components';

import {
  DataGrid, 
  GridRowsProp,
  GridColDef,
} from "@mui/x-data-grid";

import {
  Box,
  Typography,
  SvgIcon,
  useMediaQuery,
} from "@mui/material";

import {ReactComponent as TxSvg} from 'src/assets/icons/tx.svg';
import {ReactComponent as PlatformLinkedInSvg} from 'src/images/platform-linked-in.svg';
import {ReactComponent as QRSvg} from 'src/images/qr.svg';
import { AppTheme } from "src/themes";
import { makeStyles } from "@mui/styles";
import { defaultFontFamily } from "src/themes/theme";
import { formatHexStringToHexStringComponents, numberToLittleEndianHexString } from "src/utils";
import { serviceUrl } from "src/constants";

const useStyles = makeStyles((theme: AppTheme) => {
  return ({
    hashCell: theme => ({
      fontFamily: 'monospace',
    })
  });
});

function CreateProofButton ({marginLeft, disabled, onClick}: {marginLeft?: string, disabled?: boolean, onClick: () => void}) {
  return (
    <PrimaryButton sx={{
      borderRadius: '100px',
      fontSize: '18px !important',
      fontWeight: '500 !important',
      padding: '22px !important',
      marginLeft
    }} disabled={disabled} onClick={onClick} >Create Proof</PrimaryButton>
  );
}

export function MyProofs({}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    isConnected,
    installed,
    connect,
    loadingMyProofs,
    myProofs,
  } = useCCDContext();
  const styles = useStyles();

  const [state, setState] = useState({
    showBackdrop: true,
  } as any);

  const loading = loadingMyProofs && !myProofs;

  const portraitFormat = useMediaQuery('(max-width:800px)');

  const createNewProof = useCallback( () => {
    navigate("/create/1");
  }, [] );

  const listContent = myProofs;
  const rows: GridRowsProp = (listContent && !loading ? listContent : []).map(
    ({id, platform, created, decryptionKey}, index) => ({
                                          no: (index + 1).toString(),
                                          platform,
                                          name: id,
                                          id,
                                          created: created && Number.isFinite(created) ? new Date((created ?? 0) * 1000).toLocaleDateString('en-US') : '',
                                          decryptionKey, 
                                        }));

  const columns: GridColDef[] = [
    { field: "no", hide: true, flex: 0.1, sortable: false, align: 'left',  },
    { field: "platform", headerName: "#", flex: 0.50, minWidth: 50, maxWidth: 50, sortable: false, align: 'center', headerAlign: 'center', renderCell: (params) => {
      return (
        <Box sx={{width: '36px', height: '36px'}}>
          <PlatformLinkedInSvg width="36" height="36"/>
        </Box>
      );
    } },
    { field: "qr", headerName: "QR", hide: portraitFormat, flex: 0.50, minWidth: 50, maxWidth: 60, sortable: false, align: 'center', headerAlign: 'center', renderCell: (params) => {
      return (
        <Box sx={{width: '36px', height: '36px'}}>
          <QRSvg width="36" height="36" />
        </Box>
      );
    } },
    { field: "name", headerName: "Name", hide: true, flex: 0.5, sortable: false, align: 'left', },
    { field: "created",
      headerName: "Created At",
      hide: portraitFormat,
      flex: 0.25,
      headerAlign: 'center',
      sortable: false,
      align: 'center',
      renderCell: params => <Typography sx={{fontSize: '16px', fontWeight: 400}}>{params.value}</Typography>
    },
    { field: "id",
      headerName: "Id",
      cellClassName: styles.hashCell,
      flex: 1,
      sortable: false,
      align: 'left',
      renderCell: params =>
        <Typography sx={{fontSize: '16px', fontWeight: 400}}>{
          Number.isFinite(Number.parseInt(params?.value)) ?
            formatHexStringToHexStringComponents(
              numberToLittleEndianHexString(Number.parseInt(params.value))
            ).map( (x, it) => <Box component="span" sx={{marginLeft: it > 0 ? '3px' : undefined, }}>{x}</Box>)
          : 'Invalid Token ID'}
        </Typography>
    },
    {
      field: "action", headerName: "",
      width: 174,
      sortable: false,
      align: 'right',
      renderCell: (params) => {
        const {
          api
        } = params;

        const rowData = listContent?.find(x => x.id === params.row.id) ?? null;

        const gotoMyProof = useCallback((e) => {
          e.stopPropagation(); // don't select this row after clicking

          const row = {} as any;

          api
            .getAllColumns()
            .filter((c) => c.field !== "__check__" && !!c)
            .forEach(
              (c) => (row[c.field] = params.getValue(params.id, c.field))
            );

          const rowData = listContent?.find(x => x.id === row.id ) ?? null;
          if ( !rowData ) {
            console.error(`Error no row for id ${row.id} in list content ${listContent}.`);
          }
          
          const decryptionKey = encodeURIComponent( rowData?.decryptionKey ?? 'null' );
          navigate(`/my-proof/${rowData?.id}/${decryptionKey}`);
        }, []);

        const gotoExplorer = useCallback((e) => {
          e.stopPropagation();
          const row = {} as any;
          api
            .getAllColumns()
            .filter((c) => c.field !== "__check__" && !!c)
            .forEach(
              (c) => (row[c.field] = params.getValue(params.id, c.field))
            );
          const rowData = listContent?.find(x => x.id === row.id) ?? null;
          if ( !rowData ) {
            console.error("Failed getting proof by row id : " + row.id );
            return;
          }
          const CCD_SCAN_BASE_URL = process.env.REACT_APP_CCD_SCAN_BASE_URL ?? `https://testnet.ccdscan.io/`;
          const txHash =  rowData.tx;
          const url = `${CCD_SCAN_BASE_URL}?dcount=1&dentity=transaction&dhash=${txHash}`;
          window.open(url, '_blank');
        }, []);

        const downloadImage = (e: any) => {
          e.stopPropagation();

          const row = {} as any;

          api
            .getAllColumns()
            .filter((c) => c.field !== "__check__" && !!c)
            .forEach(
              (c) => (row[c.field] = params.getValue(params.id, c.field))
            );

          const rowData = listContent?.find(x => x.id === row.id ) ?? null;
          if ( !rowData ) {
            console.error("Failed getting proof by row id : " + row.id );
            return;
          }
           
          fetch(serviceUrl(`/proof/${rowData.id}/qr`), {
            method: 'GET',
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'text/plain'
            }
          }).then(response => {
            response.arrayBuffer().then(function(buffer) {
              const url = window.URL.createObjectURL(new Blob([buffer]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `qr-${rowData.id}.png`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            });
          })
          .catch(err => { 
            // debugger;
            dispatch(error("Service currently not available"));
            console.error(err);
          });          
        };

        return (
          <>
            <Button id="view-certificate-button" sx={{
              marginRight: 0,
              background: '#bababa',
              letterSpacing: '1.2',
              fontSize: '14px !important',
              padding: '0 12px !important',
              paddingTop: '1px !imporatant',
              borderRadius: '8px !imporatant',
              "&:hover": {
                background: '#8a8a8a',
                color: 'white',
              },
            }} onClick={gotoMyProof}>VIEW</Button>
            <Button id="view-in-explorer-button" disabled={!rowData.tx} sx={{
              marginLeft: 1,
              background: '#bababa',
              minWidth: '36px',
              maxWidth: '36px',
              padding: '3px 0px 0px 2px !important',
              borderRadius: '8px !imporatant',
              "&:hover": {
                background: '#8a8a8a',
                color: 'white',
              },
            }} onClick={gotoExplorer}>
              <SvgIcon component={TxSvg} htmlColor="red" sx={{
                marginTop: '6px',
                marginLeft: '5px',
                '& g#Tx': {
                  fill: 'white',
                }
              }} />
            </Button>
          </>
        );
      }
    }
  ];

  if ( installed === null || loading || loadingMyProofs ) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        margin: 'auto',
        alignItems: 'center',
        padding: '24px',
        height: '236px'
      }}>
        <LoadingIndicator text="Loading" sx={{
          display: 'flex',
          flexDirection: 'column',
        }} />
      </Box>
    );
  }

  if ( isConnected && !loading && !listContent?.length ) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto',
        alignItems: 'center',
        padding: '24px',
      }}>
        <Typography variant="h2" sx={{fontWeight: 500}} gutterBottom component="div">
          Your Proofs
        </Typography>

        <Typography variant="subtitle1" gutterBottom component="div" sx={{textAlign: 'center'}}>
          None of your social media accounts are verified yet. <br/> Click 'Create Proof' to get started
        </Typography>

        <Box sx={{display: 'flex', flexDirection: 'row', marginTop: '24px'}}>
          <CreateProofButton {...{disabled: loading, onClick: createNewProof}} />
        </Box>
      </Box>
    );
  }

  if ( !isConnected && !loading && !listContent?.length ) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto',
        alignItems: 'center',
        padding: '24px',
      }}>
        <Typography variant="h3" fontFamily={defaultFontFamily} sx={{fontWeight: 500}} gutterBottom component="div">
          No Visible Proofs
        </Typography>

        <Typography variant="subtitle1" gutterBottom component="div" sx={{textAlign: 'center'}}>
          Click 'Create Proof' to verify your Social Media profile.<br/>
          {installed !== null && installed ?
            'Or, Connect your Concordium wallet to show Proofs.' : undefined}
        </Typography>

        <Box sx={{display: 'flex', marginTop: '24px'}}>
          {installed !== null && installed ?
            <SecondaryButton sx={{marginTop: '8px',}} onClick={connect}>Connect</SecondaryButton> : undefined}
          <CreateProofButton {...{marginLeft: '16px', disabled: loading, onClick: createNewProof}} />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{
        width: "100%",
        padding: 0,
        display: 'flex',
        alignItems: 'stretch',
      }}>
        <DataGrid
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          density="comfortable"
          rowsPerPageOptions={[]}
          rows={rows}
          columns={columns}
          // pageSize={100}
          checkboxSelection={false} 
          hideFooterSelectedRowCount
          loading={loading}
          sx={{
            boxShadow: 0,
            border: 0,
            height: !loading ? `${72 + (67 * rows.length)}px !important` : `250px !important`,
            minHeight: '250px',

            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },

            '& .MuiDataGrid-row': {
              maxHeight: 'none !important',
            },

            '& .MuiDataGrid-renderingZone': {
              maxHeight: 'none !important',
            },

            '& .MuiDataGrid-footerContainer': {
              display: 'none',
            },

            '& .MuiDataGrid-overlay': {
              background: 'transparent',
            },

            '& .MuiDataGrid-columnHeaders': {
              visibility: loading ? 'hidden' : undefined,
            },

            '& .MuiDataGrid-main': {
              height: '200px !important',
            },

            '& .MuiDataGrid-virtualScroller': {
              height: 'initial !important',              
            },

            '& .MuiDataGrid-virtualScrollerContent': {
              height: `${67 * rows.length}px !important`, 
            },

            '& .MuiDataGrid-virtualScrollerRenderZone': {
              height: `${67 * rows.length}px !important`, 
            },

            '& .MuiDataGrid-columnHeader': {
              fontSize: '14px',
              paddingLeft: '16px',
              outlineStyle: 'initial !important',
            },

            '& .MuiDataGrid-cell': {
              fontSize: '14px',
              paddingLeft: '24px',
              outlineStyle: 'initial !important',
            },

            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: '600 !important',
            },

            '& .MuiDataGrid-menuIcon': {
              display: 'none',
            },

          }} />
      </Box>
      <Box sx={{
        display: 'initial',
        padding: '16px',
      }}>
        <CreateProofButton {...{disabled: loading, onClick: createNewProof}} />
      </Box>
    </>
  );
}
