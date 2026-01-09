// frontend/src/components/KnowledgeManager.js
import React,{useState,useEffect} from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from "@mui/icons-material/Delete";
import StorageIcon from "@mui/icons-material/Storage";
import{
  uploadDocuments,
  searchKnowledge,
  getKnowledgeStats,
  batchUploadText,
  clearKnowledge
} from "../services/api";

function KnowledgeManager({onNotification}){
    const [stats,setStats] = useState(null);
    const [searchQuery,setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading,setLoading] = useState(false);
    const [uploadDialogOpen,setUploadDialogOpen] = useState(false);
    const [uploadText,setUploadText] = useState("");
    const [uploadMetadata,setUploadMetadata] = useState("");

    // load stats information
    const loadStats = async()=>{
        try{
            const response = await getKnowledgeStats();
            setStats(response.stats);
        }catch(error){
            onNotification(`get stats information failed: ${error.message}`,"error");
        }
    };
    useEffect(()=>{
        loadStats();
    },[]);

    // search knowledge base
    const handleSearch = async()=>{
        if(!searchQuery.trim()){
            onNotification('input search content','warning');
            return;
        }
        setLoading(true);
        try{
          const response = await searchKnowledge(searchQuery,5);
          setSearchResults(response.results);
          onNotification(`find ${response.count} relative results`,"success");
        }catch(error){
         onNotification(`search failed: ${error.message}`,"error");
        }finally{
         setLoading(false);
        }
    };
    // upload text
    const handleUploadText = async()=>{
      if(!uploadText.trim()){
        onNotification("require text","warning");
        return;
      }
      setLoading(true);
      try{
        let metadata={};
        if(uploadMetadata.trim()){
            metadata=JSON.parse(uploadMetadata);
        }
        const response = await batchUploadText(uploadText,metadata);
        onNotification(`upload successfully ${response.chunks} document blocks`,"success");
        setUploadDialogOpen(false);
        setUploadText("");
        setUploadMetadata("");
        loadStats();
      }catch(error){
        onNotification(`upload failed: ${error.message}`,"error");
      }finally{
        setLoading(false);
      }
    };
    // clear knowledge
    const handleClearKnowledge = async()=>{
        if(!window.confirm("Are you sure you want to clear the entire knowledge base? This operation is irreversible!")){
            return;
        }
        setLoading(true);
        try{
            await clearKnowledge();
            onNotification("knowledge base has been cleared","success");
            setSearchResults([]);
            loadStats();
        }catch(error){
            onNotification(`clear failed:${error.message}`,"error");
        }finally{
            setLoading(false);
        }
    };

    return (
        <Box>
            {/**stats inform card */}
            <Grid container spacing={3} sx={{mb:3}}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{display:"flex",alignItems:"center",mb:1}}>
                                <StorageIcon sx={{mr:1,color:"primary.main"}}/>
                                <Typography variant="h6">vector numbers</Typography>
                            </Box>
                            <Typography variant="h3">
                                {stats?.totalRecordCount?.toLocaleString()||0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Storing document vectors
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{display:"flex", alignItems:"center",mb:1}}>
                                <CloudUploadIcon sx={{mr:1,color:"success.main"}}/>
                                <Typography variant="h6">dimension</Typography>
                            </Box>
                            <Typography variant="h3">
                                {stats?.dimension || 1536}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Vector Embedding Dimension
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{display:"flex",alignItems:"center",mb:1}}>
                                <SearchIcon sx={{mr:1,color:"info.main"}}/>
                                <Typography variant="h6">index status</Typography>
                            </Box>
                            <Typography variant="h3">
                                {stats ? "v":"-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats ? "ready go":"loading..."}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {/**operation area */}
            <Paper sx={{p:3,mb:3}}>
                <Typography variant="h6" gutterBottom>
                    knowledge base management
                </Typography>
                <Box sx={{display:"flex",gap:2,mb:3}}>
                    <Button
                     variant="contained"
                     startIcon={<CloudUploadIcon/>}
                     onClick={()=>setUploadDialogOpen(true)}>
                       upload documents
                     </Button>
                     <Button
                     variant="outlined"
                     color="error"
                     startIcon={<DeleteIcon />}
                     onClick={handleClearKnowledge}
                     disabled={loading || !stats?.totalRecordCount}>
                        clear knowledge base
                     </Button>
                </Box>
                {/**search area */}
                <Typography variant="subtitle1" gutterBottom sx={{mt:3}}>
                    search knowledge base
                </Typography>
                <Box sx={{display:"flex",gap:1}}>
                    <TextField
                    fullWidth
                    placeholder="input search keywords..."
                    value={searchQuery}
                    onChange={(e)=>setSearchQuery(e.target.value)}
                    onKeyPress={(e)=>e.key==="Enter"&&handleSearch()}
                    disabled={loading}
                    />
                    <Button
                    variant="contained"
                    startIcon={<SearchIcon/>}
                    onClick={handleSearch}
                    disabled={loading||!searchQuery.trim()}>
                        search
                    </Button>
                </Box>
                {loading && <LinearProgress sx={{mt:2}}/>}
            </Paper>
            {/**search results */}
            {searchResults.length>0&&(
                <Paper sx={{p:3}}>
                    <Typography variant="h6" gutterBottom>
                        search results ({searchResults.length})
                    </Typography>
                    <List>
                        {searchResults.map((result,index)=>(
                            <ListItem
                            key={result.id}
                            sx={{
                                mb:2,
                                backgroundColor:"#f5f5f5",
                                borderRadius:1,
                                flexDirection:"column",
                                alignItems:"flex-start"
                            }}
                            >
                                <Box sx={{width:"100%",display:"flex",justifyContent:"space-between",mb:1}}>
                                  <Chip
                                  label={`similarity: ${(result.score*100).toFixed(1)}%`}
                                  size="small"
                                  color="primary"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {result.id}
                                  </Typography>
                                </Box>
                                <ListItemText
                                primary={result.text}
                                secondary={
                                    result.metadata&&Object.keys(result.metadata).length>1&&(
                                        <Box sx={{mt:1}}>
                                            {Object.entries(result.metadata).map(([key,value])=>{
                                                if(key==="text") return null;
                                                return (
                                                    <Chip
                                                    key={key}
                                                    label={`${key}:${value}`}
                                                    size="small"
                                                    sx={{mr:0.5,mt:0.5}}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )
                                }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
           {/**upload dialog box */}
           <Dialog
            open={uploadDialogOpen}
            onClose={()=>setUploadDialogOpen(false)}
            maxWidth="md"
            fullWidth
           >
            <DialogTitle>upload documents to the knowledge base</DialogTitle>
            <DialogContent>
                <TextField 
                 fullWidth
                 multiline
                 rows={10}
                 label="text"
                 placeholder="Paste or type the text you want to upload..."
                 value={uploadText}
                 onChange={(e)=>setUploadText(e.target.value)}
                 sx={{mt:2,mb:2}}
                />
                <TextField
                 fullWidth
                 label="metadata (JSON formation)"
                 placeholder='{"source":"document.pdf","category":"technical document"}'
                 value={uploadMetadata}
                 onChange={(e)=>setUploadMetadata(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={()=>setUploadDialogOpen(false)}>cancel</Button>
                <Button
                 variant="contained"
                 onClick={handleUploadText}
                 disabled={loading||!uploadText.trim()}
                >upload</Button>
            </DialogActions>
           </Dialog>
        </Box>
    );
}

export default KnowledgeManager;