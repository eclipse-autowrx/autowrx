import { AutocompleteRenderInputParams, CircularProgress, TextField } from "@mui/material";
import { FC } from "react";

const AutoCompleteInputRender: FC<AutocompleteRenderInputParams & {
    loading: boolean
    label: string
}> = ({loading, label, ...params}) => {
    return (
        <TextField
        
        {...params}
        label={label}
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {loading ? <CircularProgress color="inherit" size={20} /> : null}
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    )
}

export default AutoCompleteInputRender