// frontend/src/components/AgentDashboard.js
import React,{useEffect,useState} from "react";
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Divider,
    Switch,
    FormControlLabel,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PsychologyIcon from "@mui/icons-material/Psychology";
import {
   createAgent,
   agentQuery,
   getAllAgents,
   deleteAgent,
   analyzeIntent
} from "../services/api"

const AGENT_TYPES={
default: { label: 'General Assistant', icon: '🤖', color: '#2196f3' },
technical: { label: 'Technical Expert', icon: '💻', color: '#4caf50' },
creative: { label: 'Creative Assistant', icon: '🎨', color: '#ff9800' },
analytical: { label: 'Data Analysis', icon: '📊', color: '#9c27b0' }
};

function AgentDashboard({onNotification}){
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [intentAnalysis, setIntentAnalysis] = useState(null);
  //loading all Agent
  const loadAgents = async()=>{
    try{
       const response=await getAllAgents();
       setAgents(response.agents);
    }catch(error){
        onNotification(`loading Agent failed:${error.message}`,"error");
    }
  };
  useEffect(()=>{
    loadAgents();
  },[]);
  // create new Agent
  const handleCreateAgent = async(agentType)=>{
   try{
    const response = await createAgent(agentType);
    onNotification(`Agent created successfully: ${response.agentId}`,"success");
    loadAgents();
    setSelectedAgent(response.agentId);
   }catch(error){
    onNotification(`create failed: ${error.message}`,"error");
   }
  };

  // send query
  const handleQuery= async()=>{
    if(!query.trim()){
        onNotification("please input content","warning");
        return;
    }
    if(!selectedAgent){
        onNotification("please select or create an Agent","warning");
        return;
    }
    setLoading(true);
    setResponse(null);
    setIntentAnalysis(null);
    try{
        const response= await agentQuery(query,selectedAgent,{
            useKnowledgeBase
        });
        setResponse(response);
        onNotification("search successfully","success");
    }catch(error){
        onNotification(`search failed:${error.message}`,"error");
    }finally{
        setLoading(false);
    }
  };
  // analysis intention
  const handleAnalyzeIntent = async()=>{
    if(!query.trim()){
        onNotification("please input content","warning");
        return;
    }
    setLoading(true);
    try{
      const response = await analyzeIntent(query);
      setIntentAnalysis(response.analysis);
      onNotification("intention analysis complete","success");
    }catch(error){
      onNotification(`analysis failed: ${error.message}`,"error");
    }finally{
      setLoading(false);
    }
  };
  //delete Agent
  const handleDeleteAgent = async(agentId)=>{
    try{
       await deleteAgent(agentId,"delete");
       onNotification("Agent has been deleted","success");
       if(selectedAgent===agentId){
        setSelectedAgent(null);
        setResponse(null);
       }
       loadAgents();
    }catch(error){
        onNotification(`delete failed:${error.message}`,"error");
    }
  };
  return (
    <Grid container spacing={3}>
        {/**left:Agent list */}
        <Grid item xs={12} md={4}>
            <Paper sx={{p:2}}>
                <Typography variant="h6" gutterBottom>
                    AI Agents
                </Typography>
                {/**create new Agent */}
                <Box sx={{mb:2}}>
                    <Typography variant="subtitle2" gutterBottom>
                        create new Agent:
                    </Typography>
                    <Grid container spacing={1}>
                        {Object.entries(AGENT_TYPES).map(([type,info])=>(
                            <Grid item xs={6} key={type}>
                                <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                onClick={()=>handleCreateAgent(type)}
                                sx={{justifyContent:"flex-start"}}
                                >
                                    {info.icon} {info.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Divider sx={{my:2}} />

                {/**Agent list */}
                <Typography variant="subtitle2" gutterBottom>
                    active Agents ({agents.length}):
                </Typography>
                {agents.length===0?(
                  <Typography variant="body2" color="text.secondary" align="center" sx={{py:2}}>
                    no Agent,please create one
                  </Typography>
                ):(
                 agents.map((agent)=>{
                    const typeInfo = AGENT_TYPES[agent.agentType] || AGENT_TYPES.default;
                    return (
                        <Card
                        key={agent.agentId}
                        sx={{
                            mb:1,
                            cursor:"pointer",
                            border: selectedAgent===agent.agentId?2:0,
                            borderColor:"primary.main"
                        }}
                        onClick={()=>setSelectedAgent(agent.agentId)}
                        >
                            <CardContent sx={{p:2, "&:last-child":{pb:2}}}>
                                <Box sx={{display:"flex",alignItems:"center",mb:1}}>
                                    <Box sx={{fontSize:24,mr:1}}>{typeInfo.icon}</Box>
                                    <Box sx={{flex:1}}>
                                        <Typography variant="subtitle2">{typeInfo.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {agent.agentId.slice(0,20)}...
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <Chip
                                    label={`${agent.historyLength} historys.`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    />
                                    <Button
                                    size="small"
                                    color="error"
                                    onClick={(e)=>{
                                        e.stopPropagation();
                                        handleDeleteAgent(agent.agentId);
                                    }}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                 })
                )}
            </Paper>
        </Grid>
        {/**right:search interfrace */}
        <Grid item xs={12} md={8}>
            <Paper sx={{p:3}}>
                <Typography variant="h6" gutterBottom>
                    Agent search
                </Typography>
                {selectedAgent?(
                    <>
                     <Chip
                     label={`current Agent:${selectedAgent.slice(0,25)} ...`}
                     color="primary"
                     sx={{mb:2}}
                     />
                     {/**search input */}
                     <TextField 
                     fullWidth
                     multiline
                     rows={4}
                     placeholder="input your problems or tasks..."
                     value={query}
                     onChange={(e)=>setQuery(e.target.value)}
                     disabled={loading}
                     sx={{mb:2}}
                     />
                     {/**options */}
                     <Box sx={{display:"flex",gap:2,mb:2,alignItems:"center"}}>
                        <FormControlLabel
                           control={
                            <Switch 
                            checked={useKnowledgeBase}
                            onChange={(e)=>setUseKnowledgeBase(e.target.checked)}/>
                           }
                           label="use knowledge base"
                        />
                        <Button 
                        variant="outlined"
                        size="small"
                        startIcon={<PsychologyIcon />}
                        onClick={handleAnalyzeIntent}
                        disabled={loading||!query.trim()}
                        >Analysis Intention</Button>
                     </Box>
                     {/**send button */}
                     <Button
                     fullWidth
                     variant="contained"
                     size="large"
                     startIcon={loading?<CircularProgress size={20} color="inherit" />:<SendIcon/>}
                     onClick={handleQuery}
                     disabled={loading||!query.trim()}
                     >
                        {loading?"processing ...":"send query"}
                     </Button>
                     {/**intention analysis results */}
                     {intentAnalysis && (
                        <Accordion sx={{mt:2}}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                             <Typography>Intention Analysis Results</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Intention types
                                        </Typography>
                                        <Typography variant="body1">
                                            {intentAnalysis.intent}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            domain
                                        </Typography>
                                        <Typography variant="body1">
                                            {intentAnalysis.domain}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            complexity
                                        </Typography>
                                        <Typography variant="body1">
                                            {intentAnalysis.complexity}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            need knowledge base
                                        </Typography>
                                        <Typography variant="body1">
                                            {intentAnalysis.requiresKnowledge?"yes":"no"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                     )}
                     {/**response results */}
                     {response && (
                        <Paper
                        elevation={0}
                        sx={{mt:3,p:3,backgroundColor:"#f5f5f5",borderRadius:2}}
                        >
                            <Typography variant="h6" gutterBottom>
                                Agent response
                            </Typography>
                            <Typography
                            variant="body1"
                            sx={{whiteSpace:"pre-wrap",lineHeight:1.8}}>
                                {response.answer}
                            </Typography>

                            <Divider sx={{my:2}}/>
                            
                            {/**metadata information */}
                            <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}>
                                {response.knowledgeUsed && (
                                    <Chip
                                     label="V have used knowledge base"
                                     size="small"
                                     color="success"
                                    />
                                )}
                                {response.usage && (
                                    <Chip 
                                    label={`Tokens:${response.usage.total_tokens}`}
                                    size="small"
                                    />
                                )}
                            </Box>
                            {/**knowledge source */}
                            {response.sources && response.sources.length>0&& (
                                <Accordion sx={{mt:2}}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                     <Typography>
                                        knowledge source ({response.sources.length})
                                     </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {response.sources.map((source,index)=>(
                                            <Paper key={index} sx={{p:2,mb:1,backgroundColor:"white"}}>
                                                <Box sx={{display:"flex",justifyContent:"space-between",mb:1}}>
                                                <Chip 
                                                 label={`similarity:${(source.score*100).toFixed(1)}%`}
                                                 size="small"
                                                 color="primary"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {source.id}
                                                </Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    {source.text}
                                                </Typography>            
                                            </Paper>
                                        ))}
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Paper>
                     )}
                    </>
                ):(
                    <Box
                    sx={{textAlign:"center",py:8,color:"text.secondary"}}>
                        <SmartToyIcon sx={{fontSize:80,opacity:0.3,mb:2}}/>
                        <Typography variant="h6">
                            please option or create an Agent
                        </Typography>
                        <Typography variant="body2">
                            please select existed Agent or create new one in the left side
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Grid>
    </Grid>
  );
}

export default AgentDashboard;