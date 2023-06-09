<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //$this->debugSetPlayerScore(2343492, 10);
        //$this->debugSetScore(39);
        //$this->debugSetReputation(8);

        //$this->debugAddDestinations(2343492, 'A', 15);
        //$this->debugAddDestinations(2343492, 'B', 10);

        //$this->cards->pickCardsForLocation(13, 'deck', 'void');
        
        //$this->debugLastTurn();
    }

    function debugTokens() {
        $playerId = intval($this->getActivePlayerId());
        $this->tokens->moveAllCardsInLocation('board', 'player', null, $playerId);
    }

    public function debugReplacePlayersIds() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

		// These are the id's from the BGAtable I need to debug.
		/*$ids = [
            84319026,
86175279
		];*/
        $ids = array_map(fn($dbPlayer) => intval($dbPlayer['player_id']), array_values($this->getCollectionFromDb('select player_id from player order by player_no')));

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE card SET card_location_arg=$sid WHERE card_location_arg = $id" );
			foreach ([1,2,3,4,5] as $i) { $this->DbQuery("UPDATE card SET card_location='played$sid-$i' WHERE card_location='played$id-$i'" ); }
			$this->DbQuery("UPDATE token SET card_location='played$sid' WHERE card_location='played$id'" );
			$this->DbQuery("UPDATE token SET card_location_arg=$sid WHERE card_location_arg = $id" );

            
			++$sid;
		}

        self::reloadPlayersBasicInfos();
	}

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
